import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { ENV } from '../config/env.js';
import { hashSha256, encryptField, decryptField, maskPhoneNumber } from '../utils/crypto.js';
import { generateTokens, rotateRefreshToken, revokeRefreshToken } from '../services/token.service.js';
import { sendSuccess, sendError, AppError } from '../utils/apiResponse.js';
import { processAndSavePhoto } from '../services/photo.service.js';
import { recomputePatientRisk } from '../riskEngine/riskEngine.js';

// Schemas
const RequestOtpSchema = z.object({
  phone: z.string().min(8).max(16),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(8).max(16),
  otp: z.string().min(4).max(6),
});

const SetPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const LoginPinSchema = z.object({
  phone: z.string().min(8).max(16),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const PreferencesSchema = z.object({
  language: z.enum(['en', 'hi', 'ta', 'te', 'bn', 'mr']).optional(),
  textSize: z.enum(['small', 'medium', 'large']).optional(),
});

const SideEffectsSchema = z.object({
  symptoms: z.array(z.string()).default([]),
  freeText: z.string().max(500).optional(),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function getTodayAndYesterdayKolkata(): { todayStr: string; yesterdayStr: string } {
  // Asia/Kolkata timezone offset UTC+5:30
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kolkataNow = new Date(utc + 5.5 * 3600000);

  const todayStr = kolkataNow.toISOString().slice(0, 10);

  const yesterday = new Date(kolkataNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  return { todayStr, yesterdayStr };
}

// 1. Request OTP
export async function requestOtp(req: Request, res: Response) {
  const { phone } = RequestOtpSchema.parse(req.body);
  const cleanPhone = normalizePhone(phone);
  const phoneHash = hashSha256(cleanPhone);

  // Generate 6-digit OTP (Mock 123456 in dev/test)
  const otp = ENV.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';

  // Store in Redis with 5-minute TTL (300 seconds)
  const redisKey = `otp:${phoneHash}`;
  await redis.set(redisKey, otp, 'EX', 300);

  return sendSuccess(res, {
    messageKey: 'auth.otp_sent',
    message: 'Verification code sent.',
    expiresInSeconds: 300,
    devOtp: ENV.NODE_ENV !== 'production' ? otp : undefined,
  });
}

// 2. Verify OTP
export async function verifyOtp(req: Request, res: Response) {
  const { phone, otp } = VerifyOtpSchema.parse(req.body);
  const cleanPhone = normalizePhone(phone);
  const phoneHash = hashSha256(cleanPhone);

  const redisKey = `otp:${phoneHash}`;
  const storedOtp = await redis.get(redisKey);

  if (!storedOtp || storedOtp !== otp) {
    return sendError(res, 401, 'INVALID_OTP', 'auth.invalid_otp', 'Invalid or expired verification code.');
  }

  // OTP verified, remove from Redis
  await redis.del(redisKey);

  // Find or create patient
  let patient = await prisma.patient.findFirst({
    where: { phoneHash },
  });

  if (!patient) {
    // Generate new patient code e.g. P-0500
    const count = await prisma.patient.count();
    const code = `P-${String(count + 1).padStart(4, '0')}`;

    patient = await prisma.patient.create({
      data: {
        code,
        firstName: 'Patient',
        phoneEncrypted: encryptField(`+91 ${cleanPhone}`),
        phoneHash,
        phase: 'INTENSIVE',
        regimen: '4-FDC Daily',
        phcLocation: 'Community Clinic',
        reminderTime: '08:00',
        consentGiven: true,
      },
    });
  }

  // Issue tokens
  const tokens = await generateTokens({
    id: patient.id,
    role: 'patient',
    code: patient.code,
    name: patient.firstName,
  });

  return sendSuccess(res, {
    ...tokens,
    patientId: patient.id,
    code: patient.code,
    firstName: patient.firstName,
    hasPin: !!patient.pinHash,
    language: patient.language,
    textSize: patient.textSize,
  });
}

// 3. Set 4-digit PIN
export async function setPin(req: Request, res: Response) {
  const patientId = req.user!.id;
  const { pin } = SetPinSchema.parse(req.body);

  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.patient.update({
    where: { id: patientId },
    data: { pinHash },
  });

  return sendSuccess(res, {
    messageKey: 'auth.pin_set_success',
    message: 'Security PIN set successfully.',
  });
}

// 4. Login with 4-digit PIN (With 5-try / 15-minute lockout)
export async function loginPin(req: Request, res: Response) {
  const { phone, pin } = LoginPinSchema.parse(req.body);
  const cleanPhone = normalizePhone(phone);
  const phoneHash = hashSha256(cleanPhone);

  const lockoutKey = `lockout:pin:${phoneHash}`;
  const counterKey = `failed_attempts:pin:${phoneHash}`;

  // Check lockout
  const isLocked = await redis.get(lockoutKey);
  if (isLocked) {
    const ttlSeconds = await redis.ttl(lockoutKey);
    const ttlMinutes = Math.max(1, Math.ceil(ttlSeconds / 60));
    return sendError(
      res,
      423,
      'PIN_LOCKED',
      'auth.pin_locked',
      `PIN locked due to 5 failed attempts. Please try again in ${ttlMinutes} minutes.`,
      { remainingSeconds: ttlSeconds }
    );
  }

  const patient = await prisma.patient.findFirst({
    where: { phoneHash },
  });

  if (!patient || !patient.pinHash) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'auth.invalid_pin', 'Invalid phone number or PIN.');
  }

  const isMatch = await bcrypt.compare(pin, patient.pinHash);

  if (!isMatch) {
    // Increment failed attempts
    const attempts = await redis.incr(counterKey);
    if (attempts === 1) {
      await redis.expire(counterKey, 900); // 15 min expiration window
    }

    if (attempts >= 5) {
      // Lock for 15 minutes (900 seconds)
      await redis.set(lockoutKey, 'locked', 'EX', 900);
      await redis.del(counterKey);
      return sendError(
        res,
        423,
        'PIN_LOCKED',
        'auth.pin_locked',
        'PIN locked due to 5 failed attempts. Please try again in 15 minutes.',
        { remainingSeconds: 900 }
      );
    }

    const remaining = 5 - attempts;
    return sendError(
      res,
      401,
      'INVALID_PIN',
      'auth.invalid_pin',
      `Incorrect PIN. ${remaining} attempts remaining before lockout.`,
      { attemptsRemaining: remaining }
    );
  }

  // Successful login, clear failed counter
  await redis.del(counterKey);

  const tokens = await generateTokens({
    id: patient.id,
    role: 'patient',
    code: patient.code,
    name: patient.firstName,
  });

  return sendSuccess(res, {
    ...tokens,
    patientId: patient.id,
    code: patient.code,
    firstName: patient.firstName,
    language: patient.language,
    textSize: patient.textSize,
  });
}

// 5. Refresh token
export async function refreshPatientToken(req: Request, res: Response) {
  const refreshToken = req.body?.refreshToken;
  if (!refreshToken) {
    return sendError(res, 400, 'MISSING_REFRESH_TOKEN', 'auth.missing_refresh_token', 'Refresh token is required.');
  }

  const newTokens = await rotateRefreshToken(refreshToken);
  if (!newTokens) {
    return sendError(res, 401, 'INVALID_REFRESH_TOKEN', 'auth.invalid_refresh_token', 'Invalid or expired session.');
  }

  return sendSuccess(res, newTokens);
}

// 6. Logout
export async function logoutPatient(req: Request, res: Response) {
  const refreshToken = req.body?.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return sendSuccess(res, { messageKey: 'auth.logged_out', message: 'Logged out successfully.' });
}

// 7. GET /today status
export async function getTodayStatus(req: Request, res: Response) {
  const patientId = req.user!.id;
  const { todayStr, yesterdayStr } = getTodayAndYesterdayKolkata();

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      checkins: {
        where: {
          date: { in: [todayStr, yesterdayStr] },
        },
      },
    },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const todayCheckin = patient.checkins.find((c) => c.date === todayStr);
  const yesterdayCheckin = patient.checkins.find((c) => c.date === yesterdayStr);

  let status: 'done' | 'not_done' | 'missed_yesterday' = 'not_done';
  let messageKey = 'patient.today.not_done';

  if (todayCheckin) {
    status = 'done';
    messageKey = 'patient.today.done';
  } else if (!yesterdayCheckin) {
    // If patient was registered before yesterday and has no checkin yesterday
    status = 'missed_yesterday';
    messageKey = 'patient.today.missed_yesterday';
  }

  // Calculate current streak
  const recentCheckins = await prisma.checkin.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
    take: 30,
  });

  let currentStreak = 0;
  for (const c of recentCheckins) {
    if (c.status === 'CHECKED_IN') {
      currentStreak++;
    } else {
      break;
    }
  }

  return sendSuccess(res, {
    status,
    messageKey,
    firstName: patient.firstName,
    reminderTime: patient.reminderTime,
    currentStreak,
    checkedInToday: !!todayCheckin,
    missedYesterday: status === 'missed_yesterday',
    date: todayStr,
  });
}

// 8. POST /checkins (Supports photo upload or method with Idempotency)
export async function submitCheckin(req: Request, res: Response) {
  const patientId = req.user!.id;
  const idempotencyKey = req.header('idempotency-key') || req.body?.idempotencyKey;
  const { todayStr } = getTodayAndYesterdayKolkata();

  // Check Redis idempotency key
  if (idempotencyKey) {
    const cachedResponse = await redis.get(`idemp:checkin:${idempotencyKey}`);
    if (cachedResponse) {
      return res.status(200).json(JSON.parse(cachedResponse));
    }
  }

  let photoUrl: string | undefined;
  if (req.file) {
    const processed = await processAndSavePhoto(req.file.buffer);
    photoUrl = processed.photoUrl;
  } else if (req.body?.photoUrl) {
    photoUrl = req.body.photoUrl;
  }

  const rawMethod = (req.body?.method || 'photo').toLowerCase();
  let method: 'PHOTO' | 'IVR' | 'COUNSELLOR_CONFIRMED' = 'PHOTO';
  if (rawMethod === 'ivr') method = 'IVR';
  if (rawMethod === 'tell_counsellor' || rawMethod === 'counsellor_confirmed') method = 'COUNSELLOR_CONFIRMED';

  try {
    // Upsert or create checkin for today
    const checkin = await prisma.checkin.upsert({
      where: {
        patientId_date: {
          patientId,
          date: todayStr,
        },
      },
      update: {
        method,
        status: 'CHECKED_IN',
        photoUrl: photoUrl || undefined,
        submittedAt: new Date(),
        idempotencyKey: idempotencyKey || undefined,
      },
      create: {
        patientId,
        date: todayStr,
        method,
        status: 'CHECKED_IN',
        photoUrl,
        idempotencyKey,
      },
    });

    // Invalidate counsellor dashboard caches
    await redis.del('dashboard:summary:*');

    // Trigger risk recomputation
    recomputePatientRisk(patientId).catch(() => {});

    const responsePayload = {
      success: true,
      data: {
        checkinId: checkin.id,
        date: checkin.date,
        method: checkin.method.toLowerCase(),
        status: 'checked_in',
        photoUrl: checkin.photoUrl,
        messageKey: 'patient.checkin_saved',
      },
    };

    // Store in Redis idempotency cache for 24h
    if (idempotencyKey) {
      await redis.set(`idemp:checkin:${idempotencyKey}`, JSON.stringify(responsePayload), 'EX', 86400);
    }

    return res.status(201).json(responsePayload);
  } catch (error: any) {
    // If unique constraint on idempotencyKey failed in DB
    if (error.code === 'P2002' && idempotencyKey) {
      const existing = await prisma.checkin.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return sendSuccess(res, {
          checkinId: existing.id,
          date: existing.date,
          status: 'checked_in',
          messageKey: 'patient.checkin_saved',
        });
      }
    }
    throw error;
  }
}

// 9. POST /side-effects
export async function reportSideEffects(req: Request, res: Response) {
  const patientId = req.user!.id;
  const { symptoms, freeText } = SideEffectsSchema.parse(req.body);

  const severeSymptoms = ['sick', 'rash', 'stomach'];
  const hasSevere = symptoms.some((s) => severeSymptoms.includes(s));

  const report = await prisma.sideEffectReport.create({
    data: {
      patientId,
      symptoms: JSON.stringify(symptoms),
      freeTextEncrypted: freeText ? encryptField(freeText) : null,
      severityFlag: hasSevere,
    },
  });

  // If severe symptoms reported, auto-create a task for the counsellor
  if (hasSevere || (freeText && freeText.trim().length > 0)) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { assignedCounsellorId: true },
    });

    await prisma.counsellorTask.create({
      data: {
        patientId,
        counsellorId: patient?.assignedCounsellorId || null,
        type: 'SIDE_EFFECT_ALERT',
        status: 'PENDING',
        details: `Reported symptoms: ${symptoms.join(', ')}${freeText ? ` - Note: "${freeText}"` : ''}`,
      },
    });

    // Recompute risk
    recomputePatientRisk(patientId).catch(() => {});
  }

  return sendSuccess(res, {
    reportId: report.id,
    messageKey: 'patient.side_effects_saved',
    message: 'Your notes have been shared with your counsellor.',
  }, 201);
}

// 10. GET /calendar?month=YYYY-MM
export async function getCalendar(req: Request, res: Response) {
  const patientId = req.user!.id;
  const monthParam = (req.query.month as string) || getTodayAndYesterdayKolkata().todayStr.slice(0, 7); // e.g. "2026-10"

  const [yearStr, monthNumStr] = monthParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const { todayStr } = getTodayAndYesterdayKolkata();

  const checkins = await prisma.checkin.findMany({
    where: {
      patientId,
      date: {
        startsWith: monthParam,
      },
    },
  });

  const checkinMap = new Map(checkins.map((c) => [c.date, c]));

  let checkedInCount = 0;
  let passedDaysCount = 0;

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${monthParam}-${String(d).padStart(2, '0')}`;
    const checkin = checkinMap.get(dayStr);

    let status: 'checked_in' | 'not_recorded' | 'upcoming' = 'upcoming';

    if (dayStr <= todayStr) {
      passedDaysCount++;
      if (checkin && checkin.status === 'CHECKED_IN') {
        status = 'checked_in';
        checkedInCount++;
      } else {
        status = 'not_recorded';
      }
    }

    days.push({
      date: dayStr,
      day: d,
      status,
    });
  }

  const summary = `${checkedInCount} of ${passedDaysCount || daysInMonth} days checked in`;

  return sendSuccess(res, {
    month: monthParam,
    summary,
    checkedInCount,
    totalDays: daysInMonth,
    passedDaysCount,
    days,
  });
}

// 11. GET & PUT /preferences
export async function getPreferences(req: Request, res: Response) {
  const patientId = req.user!.id;
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { language: true, textSize: true },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  return sendSuccess(res, patient);
}

export async function updatePreferences(req: Request, res: Response) {
  const patientId = req.user!.id;
  const data = PreferencesSchema.parse(req.body);

  const updated = await prisma.patient.update({
    where: { id: patientId },
    data,
    select: { language: true, textSize: true },
  });

  return sendSuccess(res, updated);
}

// 12. POST /help-request
export async function submitHelpRequest(req: Request, res: Response) {
  const patientId = req.user!.id;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { assignedCounsellorId: true },
  });

  const task = await prisma.counsellorTask.create({
    data: {
      patientId,
      counsellorId: patient?.assignedCounsellorId || null,
      type: 'HELP_REQUEST',
      status: 'PENDING',
      details: 'Patient requested assistance through help screen.',
    },
  });

  return sendSuccess(res, {
    taskId: task.id,
    messageKey: 'patient.help_requested',
    message: 'Your counsellor has been notified and will reach out to you.',
  }, 201);
}
