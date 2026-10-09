import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { decryptField, maskPhoneNumber, encryptField } from '../utils/crypto.js';
import { generateTokens, rotateRefreshToken, revokeRefreshToken } from '../services/token.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { recordAuditLog } from '../services/audit.service.js';
import { recomputePatientRisk } from '../riskEngine/riskEngine.js';

// Schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const FollowupSchema = z.object({
  reason: z.string().min(1),
  outcome: z.enum(['REACHED', 'NO_ANSWER', 'REFUSED', 'VISIT_SCHEDULED']),
  notes: z.string().optional(),
  nextFollowupDate: z.string().optional(), // YYYY-MM-DD
});

// Helper: Asia/Kolkata date
function getKolkataDateString(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000).toISOString().slice(0, 10);
}

// 1. Counsellor Login
export async function counsellorLogin(req: Request, res: Response) {
  const { email, password } = LoginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'auth.invalid_credentials', 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'auth.invalid_credentials', 'Invalid email or password.');
  }

  const role = user.role.toLowerCase() as 'counsellor' | 'supervisor';
  const tokens = await generateTokens({
    id: user.id,
    role,
    email: user.email,
    name: user.name,
  });

  return sendSuccess(res, {
    ...tokens,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      district: user.district,
    },
  });
}

// 2. Counsellor Logout
export async function counsellorLogout(req: Request, res: Response) {
  const refreshToken = req.body?.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return sendSuccess(res, { messageKey: 'auth.logged_out', message: 'Logged out successfully.' });
}

// 3. GET /dashboard (Cached 60s in Redis)
export async function getDashboard(req: Request, res: Response) {
  const counsellorId = req.user!.id;
  const isSupervisor = req.user!.role === 'supervisor';
  const cacheKey = `dashboard:summary:${isSupervisor ? 'all' : counsellorId}`;

  // Check Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  const todayStr = getKolkataDateString();

  // Filter condition
  const patientWhere = isSupervisor ? {} : { assignedCounsellorId: counsellorId };

  // 1. Total patients
  const totalPatients = await prisma.patient.count({ where: patientWhere });

  // 2. Checked in today
  const checkedInToday = await prisma.checkin.count({
    where: {
      date: todayStr,
      status: 'CHECKED_IN',
      patient: patientWhere,
    },
  });

  // 3. Need attention (Patients with latest risk HIGH or MEDIUM)
  const highMediumRiskPatients = await prisma.patient.findMany({
    where: {
      ...patientWhere,
      riskScores: {
        some: {
          level: { in: ['HIGH', 'MEDIUM'] },
        },
      },
    },
    include: {
      riskScores: {
        orderBy: { computedAt: 'desc' },
        take: 1,
      },
    },
  });

  const needAttentionCount = highMediumRiskPatients.length;

  // 4. Follow-ups due today
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  const followupsDue = await prisma.followup.count({
    where: {
      ...(isSupervisor ? {} : { counsellorId }),
      nextFollowupDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Top 5 attention list
  const topAttentionRows = highMediumRiskPatients
    .sort((a, b) => {
      const scoreA = a.riskScores[0]?.priorityScore || 0;
      const scoreB = b.riskScores[0]?.priorityScore || 0;
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map((p) => {
      const latestRisk = p.riskScores[0];
      let reasons: any[] = [];
      try {
        reasons = JSON.parse(latestRisk?.topReasons || '[]');
      } catch {}

      return {
        id: p.code,
        patientDbId: p.id,
        name: p.firstName + (p.lastName ? ` ${p.lastName}` : ''),
        firstName: p.firstName,
        phone: maskPhoneNumber(decryptField(p.phoneEncrypted)),
        riskBand: latestRisk?.level === 'HIGH' ? 'High' : latestRisk?.level === 'MEDIUM' ? 'Medium' : 'Low',
        riskScore: latestRisk?.score || 30,
        oneLineReason: reasons[0]?.text || 'Needs proactive review',
        treatmentPhase: `${p.phase === 'INTENSIVE' ? 'Intensive' : 'Continuation'} Phase - Month ${p.monthNumber}`,
      };
    });

  const adherenceRate = totalPatients > 0 ? Math.round((checkedInToday / totalPatients) * 100) : 0;

  const resultPayload = {
    success: true,
    data: {
      metrics: {
        patients: totalPatients,
        checkedInToday,
        adherenceRate,
        needAttention: needAttentionCount,
        followupsDue,
      },
      needsAttentionList: topAttentionRows,
      date: todayStr,
    },
  };

  // Cache for 60 seconds
  await redis.set(cacheKey, JSON.stringify(resultPayload), 'EX', 60);

  return res.status(200).json(resultPayload);
}

// 4. GET /queue (Ranked Priority Queue)
export async function getPriorityQueue(req: Request, res: Response) {
  const counsellorId = req.user!.id;
  const isSupervisor = req.user!.role === 'supervisor';

  const { search, risk, phase, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const whereClause: any = isSupervisor ? {} : { assignedCounsellorId: counsellorId };

  if (risk && risk !== 'All') {
    whereClause.riskScores = {
      some: {
        level: risk.toUpperCase(),
      },
    };
  }

  if (phase && phase !== 'All') {
    whereClause.phase = phase.toUpperCase();
  }

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [totalCount, patients] = await Promise.all([
    prisma.patient.count({ where: whereClause }),
    prisma.patient.findMany({
      where: whereClause,
      include: {
        riskScores: {
          orderBy: { computedAt: 'desc' },
          take: 1,
        },
        followups: {
          orderBy: { loggedAt: 'desc' },
          take: 1,
        },
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  // Rank by priorityScore descending
  const ranked = patients
    .map((p) => {
      const latestRisk = p.riskScores[0];
      let reasons: any[] = [];
      try {
        reasons = JSON.parse(latestRisk?.topReasons || '[]');
      } catch {}

      // Last contact format e.g. "2 days ago"
      let lastContact = 'Never';
      if (p.lastContactAt) {
        const days = Math.floor((Date.now() - p.lastContactAt.getTime()) / (1000 * 3600 * 24));
        lastContact = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
      } else if (p.followups[0]) {
        const days = Math.floor((Date.now() - p.followups[0].loggedAt.getTime()) / (1000 * 3600 * 24));
        lastContact = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
      }

      return {
        id: p.code,
        patientDbId: p.id,
        name: p.firstName + (p.lastName ? ` ${p.lastName}` : ''),
        firstName: p.firstName,
        phone: maskPhoneNumber(decryptField(p.phoneEncrypted)), // Masked for list privacy!
        age: p.age || 32,
        gender: p.gender || 'Female',
        treatmentPhase: `${p.phase === 'INTENSIVE' ? 'Intensive' : 'Continuation'} Phase - Month ${p.monthNumber}`,
        regimen: p.regimen,
        phcLocation: `${p.phcLocation} (${p.distanceToClinicKm} km)`,
        riskBand: latestRisk?.level === 'HIGH' ? 'High' : latestRisk?.level === 'MEDIUM' ? 'Medium' : 'Low',
        riskScore: latestRisk?.score || 30,
        priorityScore: latestRisk?.priorityScore || 30,
        oneLineReason: reasons[0]?.text || 'Needs proactive follow-up',
        lastContact,
        suggestedAction: latestRisk?.suggestedAction || 'Review adherence record with patient.',
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, idx) => ({
      rank: (pageNum - 1) * limitNum + idx + 1,
      ...item,
    }));

  return sendSuccess(res, {
    items: ranked,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
}

// 5. GET /patients/:id (Patient Profile & Timeline)
export async function getPatientProfile(req: Request, res: Response) {
  const patientIdOrCode = req.params.id;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
    },
    include: {
      riskScores: {
        orderBy: { computedAt: 'desc' },
        take: 1,
      },
      checkins: {
        orderBy: { submittedAt: 'desc' },
        take: 15,
      },
      sideEffectReports: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      followups: {
        orderBy: { loggedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const latestRisk = patient.riskScores[0];
  let reasons: any[] = [];
  try {
    reasons = JSON.parse(latestRisk?.topReasons || '[]');
  } catch {}

  // Build unified chronological timeline
  const timeline: any[] = [];

  patient.checkins.forEach((c) => {
    timeline.push({
      id: `checkin-${c.id}`,
      date: c.date,
      type: c.status === 'CHECKED_IN' ? 'check_in' : 'missed',
      title: c.status === 'CHECKED_IN' ? 'Patient-reported medicine check-in' : 'Missed medicine check-in',
      description: `Reported via ${c.method.toLowerCase()} at ${c.submittedAt.toISOString().slice(11, 16)}`,
      photoUrl: c.photoUrl,
      timestamp: c.submittedAt.getTime(),
    });
  });

  patient.sideEffectReports.forEach((s) => {
    let syms: string[] = [];
    try {
      syms = JSON.parse(s.symptoms);
    } catch {}
    timeline.push({
      id: `sideeffect-${s.id}`,
      date: s.createdAt.toISOString().slice(0, 10),
      type: 'side_effect',
      title: 'Side effect reported',
      description: `Reported: ${syms.join(', ')}${s.freeTextEncrypted ? ` - "${decryptField(s.freeTextEncrypted)}"` : ''}`,
      timestamp: s.createdAt.getTime(),
    });
  });

  patient.followups.forEach((f) => {
    timeline.push({
      id: `followup-${f.id}`,
      date: f.loggedAt.toISOString().slice(0, 10),
      type: 'call',
      title: 'Phone follow-up logged',
      description: f.notesEncrypted ? decryptField(f.notesEncrypted) : `Call completed (${f.outcome})`,
      outcome: f.outcome === 'REACHED' ? 'Reached' : f.outcome === 'NO_ANSWER' ? 'No answer' : 'Refused',
      timestamp: f.loggedAt.getTime(),
    });
  });

  // Sort timeline latest first
  timeline.sort((a, b) => b.timestamp - a.timestamp);

  // Calculate adherence percentage
  const totalLoggedCheckins = patient.checkins.length;
  const successfulCheckins = patient.checkins.filter((c) => c.status === 'CHECKED_IN').length;
  const adherencePercentage = totalLoggedCheckins > 0 ? Math.round((successfulCheckins / totalLoggedCheckins) * 100) : 80;

  return sendSuccess(res, {
    id: patient.code,
    patientDbId: patient.id,
    name: patient.firstName + (patient.lastName ? ` ${patient.lastName}` : ''),
    firstName: patient.firstName,
    phone: maskPhoneNumber(decryptField(patient.phoneEncrypted)), // Masked by default
    age: patient.age || 32,
    gender: patient.gender || 'Female',
    treatmentPhase: `${patient.phase === 'INTENSIVE' ? 'Intensive' : 'Continuation'} Phase - Month ${patient.monthNumber}`,
    regimen: patient.regimen,
    phcLocation: `${patient.phcLocation} (${patient.distanceToClinicKm} km)`,
    riskBand: latestRisk?.level === 'HIGH' ? 'High' : latestRisk?.level === 'MEDIUM' ? 'Medium' : 'Low',
    riskScore: latestRisk?.score || 30,
    oneLineReason: reasons[0]?.text || 'Needs proactive review',
    adherencePercentage,
    flagSummary: latestRisk?.flagSummary || 'Baseline adherence on track.',
    reasons,
    suggestedAction: latestRisk?.suggestedAction || 'Review adherence with patient.',
    timeline,
  });
}

// 6. GET /patients/:id/why-flagged (Explainable Driver Weights)
export async function getWhyFlagged(req: Request, res: Response) {
  const patientIdOrCode = req.params.id;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
    },
    include: {
      riskScores: {
        orderBy: { computedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const latestRisk = patient.riskScores[0];
  let reasons: any[] = [];
  try {
    reasons = JSON.parse(latestRisk?.topReasons || '[]');
  } catch {}

  return sendSuccess(res, {
    patientId: patient.code,
    riskBand: latestRisk?.level === 'HIGH' ? 'High' : latestRisk?.level === 'MEDIUM' ? 'Medium' : 'Low',
    riskScore: latestRisk?.score || 30,
    flagSummary: latestRisk?.flagSummary || 'Patient adherence requires ongoing support.',
    reasons,
    suggestedAction: latestRisk?.suggestedAction || 'Conduct scheduled follow-up call.',
    modelVersion: latestRisk?.modelVersion || 'rule-v1.0',
    computedAt: latestRisk?.computedAt || new Date(),
  });
}

// 7. GET /patients/:id/risk-trend?days=30|60
export async function getRiskTrend(req: Request, res: Response) {
  const patientIdOrCode = req.params.id;
  const daysParam = parseInt((req.query.days as string) || '30', 10);

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
    },
    select: { id: true, code: true },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysParam);

  const scores = await prisma.riskScore.findMany({
    where: {
      patientId: patient.id,
      computedAt: { gte: cutoff },
    },
    orderBy: { computedAt: 'asc' },
    select: {
      score: true,
      level: true,
      computedAt: true,
    },
  });

  const trendPoints = scores.map((s) => ({
    date: s.computedAt.toISOString().slice(0, 10),
    score: s.score,
    level: s.level,
  }));

  return sendSuccess(res, {
    patientId: patient.code,
    days: daysParam,
    trend: trendPoints,
  });
}

// 8. POST /patients/:id/followups (Log Follow-up & Refresh Risk)
export async function logFollowup(req: Request, res: Response) {
  const counsellorId = req.user!.id;
  const patientIdOrCode = req.params.id;
  const { reason, outcome, notes, nextFollowupDate } = FollowupSchema.parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
    },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const followup = await prisma.followup.create({
    data: {
      patientId: patient.id,
      counsellorId,
      reason,
      outcome,
      notesEncrypted: notes ? encryptField(notes) : null,
      nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate) : null,
      loggedAt: new Date(),
    },
  });

  // Update patient lastContactAt if reached
  if (outcome === 'REACHED') {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastContactAt: new Date() },
    });
  }

  // Audit log
  await recordAuditLog({
    userId: counsellorId,
    userRole: req.user!.role,
    action: 'FOLLOWUP_LOGGED',
    resourceType: 'Patient',
    resourceId: patient.id,
    metadata: { reason, outcome, nextFollowupDate },
  });

  // Recompute risk and refresh queue caches
  await recomputePatientRisk(patient.id);
  await redis.del('dashboard:summary:*');

  return sendSuccess(res, {
    followupId: followup.id,
    message: 'Follow-up log saved and risk score updated.',
  }, 201);
}

// 9. GET /patients/:id/contact-history
export async function getContactHistory(req: Request, res: Response) {
  const patientIdOrCode = req.params.id;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
    },
    select: { id: true, code: true },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const logs = await prisma.followup.findMany({
    where: { patientId: patient.id },
    orderBy: { loggedAt: 'desc' },
    include: {
      counsellor: { select: { name: true } },
    },
  });

  const history = logs.map((f) => ({
    id: f.id,
    counsellorName: f.counsellor.name,
    reason: f.reason,
    outcome: f.outcome,
    notes: f.notesEncrypted ? decryptField(f.notesEncrypted) : '',
    nextFollowupDate: f.nextFollowupDate?.toISOString().slice(0, 10),
    loggedAt: f.loggedAt.toISOString(),
  }));

  return sendSuccess(res, { history });
}

// 10. POST /patients/:id/call (Returns full number + writes AuditLog)
export async function initiatePatientCall(req: Request, res: Response) {
  const counsellorId = req.user!.id;
  const patientIdOrCode = req.params.id;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
    },
  });

  if (!patient) {
    return sendError(res, 404, 'PATIENT_NOT_FOUND', 'patient.not_found', 'Patient not found.');
  }

  const fullPhoneNumber = decryptField(patient.phoneEncrypted);

  // Write immutable audit log
  await recordAuditLog({
    userId: counsellorId,
    userRole: req.user!.role,
    action: 'CALL_INITIATED',
    resourceType: 'Patient',
    resourceId: patient.id,
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
    metadata: {
      patientCode: patient.code,
      purpose: 'Telephonic Adherence Counselling',
    },
  });

  return sendSuccess(res, {
    patientCode: patient.code,
    name: patient.firstName,
    fullPhoneNumber, // Decrypted full number strictly for call initiation
    auditRecorded: true,
  });
}
