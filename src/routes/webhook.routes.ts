import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { hashSha256 } from '../utils/crypto.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { recomputePatientRisk } from '../riskEngine/riskEngine.js';

const router = Router();

// Layer 1 Auth: API key must have 'ivr_webhook' scope
router.use(requireApiKey(['ivr_webhook']));

const IvrWebhookSchema = z.object({
  from: z.string().min(8),
  digitsPressed: z.enum(['1', '2']),
  callSid: z.string().optional(),
});

function getTodayKolkata(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000).toISOString().slice(0, 10);
}

/**
 * POST /api/v1/webhooks/ivr
 * Handles interactive voice response callbacks:
 * Press 1: Confirmed medicine check-in (patient-reported)
 * Press 2: Requested assistance
 */
router.post('/ivr', async (req: Request, res: Response): Promise<any> => {
  const { from, digitsPressed, callSid } = IvrWebhookSchema.parse(req.body);

  const cleanPhone = from.replace(/\D/g, '').slice(-10);
  const phoneHash = hashSha256(cleanPhone);

  const patient = await prisma.patient.findFirst({
    where: { phoneHash },
  });

  // Log IVR call event
  await prisma.ivrCall.create({
    data: {
      patientId: patient?.id || null,
      callSid: callSid || null,
      fromPhoneHash: phoneHash,
      digitsPressed,
      callStatus: 'COMPLETED',
    },
  });

  if (!patient) {
    return sendSuccess(res, {
      status: 'unregistered_number',
      message: 'Call logged but phone number is not linked to an active patient.',
    });
  }

  const todayStr = getTodayKolkata();

  if (digitsPressed === '1') {
    // Record IVR Check-in
    await prisma.checkin.upsert({
      where: {
        patientId_date: {
          patientId: patient.id,
          date: todayStr,
        },
      },
      update: {
        method: 'IVR',
        status: 'CHECKED_IN',
        submittedAt: new Date(),
      },
      create: {
        patientId: patient.id,
        date: todayStr,
        method: 'IVR',
        status: 'CHECKED_IN',
      },
    });

    // Recompute patient risk
    recomputePatientRisk(patient.id).catch(() => {});

    return sendSuccess(res, {
      action: 'checkin_recorded',
      method: 'ivr',
      date: todayStr,
      message: 'Patient-reported medicine check-in successfully logged via IVR.',
    });
  }

  if (digitsPressed === '2') {
    // Patient pressed 2: Request help -> Create Counsellor Task
    const task = await prisma.counsellorTask.create({
      data: {
        patientId: patient.id,
        counsellorId: patient.assignedCounsellorId || null,
        type: 'HELP_REQUEST',
        status: 'PENDING',
        details: 'Patient pressed 2 on daily interactive voice call requesting counsellor assistance.',
      },
    });

    return sendSuccess(res, {
      action: 'help_task_created',
      taskId: task.id,
      message: 'Counsellor task generated for immediate outreach.',
    });
  }

  return sendError(res, 400, 'INVALID_INPUT', 'ivr.invalid_digit', 'Invalid digit pressed.');
});

export default router;
