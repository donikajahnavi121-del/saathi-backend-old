import nodeCron from 'node-cron';
import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { decryptField } from '../utils/crypto.js';
import { sendNeutralDailyReminder } from '../services/sms.service.js';
import { cleanupExpiredPhotos } from '../services/photo.service.js';
import { recomputeAllPatientsRisk } from '../riskEngine/riskEngine.js';

function getKolkataTime(): { dateStr: string; timeStr: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kolkata = new Date(utc + 5.5 * 3600000);
  const dateStr = kolkata.toISOString().slice(0, 10);
  const timeStr = `${String(kolkata.getHours()).padStart(2, '0')}:${String(kolkata.getMinutes()).padStart(2, '0')}`;
  return { dateStr, timeStr };
}

/**
 * 1. Dispatches neutral reminders at each patient's reminderTime
 */
export async function dispatchScheduledReminders(): Promise<number> {
  const { timeStr } = getKolkataTime();

  const eligiblePatients = await prisma.patient.findMany({
    where: {
      reminderTime: timeStr,
      consentGiven: true,
    },
    select: {
      id: true,
      phoneEncrypted: true,
    },
  });

  let sent = 0;
  for (const patient of eligiblePatients) {
    const phone = decryptField(patient.phoneEncrypted);
    if (phone) {
      await sendNeutralDailyReminder(phone);
      sent++;
    }
  }

  if (sent > 0) {
    logger.info({ count: sent, timeSlot: timeStr }, 'Dispatched scheduled daily reminders');
  }
  return sent;
}

/**
 * 2. Checks for 2 consecutive missed days and auto-creates a counsellor task.
 * Non-alarming: Zero alarming messages to the patient.
 */
export async function checkConsecutiveMissesAndEscalate(): Promise<number> {
  const now = new Date();
  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 1);
  const d2 = new Date(now);
  d2.setDate(d2.getDate() - 2);

  const d1Str = d1.toISOString().slice(0, 10);
  const d2Str = d2.toISOString().slice(0, 10);

  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      code: true,
      assignedCounsellorId: true,
      checkins: {
        where: {
          date: { in: [d1Str, d2Str] },
          status: 'CHECKED_IN',
        },
      },
    },
  });

  let tasksCreated = 0;

  for (const patient of patients) {
    // If 0 checkins recorded in both d1 and d2
    if (patient.checkins.length === 0) {
      // Check if pending task already exists
      const existingTask = await prisma.counsellorTask.findFirst({
        where: {
          patientId: patient.id,
          type: 'MISSED_TWO_DAYS',
          status: 'PENDING',
        },
      });

      if (!existingTask) {
        await prisma.counsellorTask.create({
          data: {
            patientId: patient.id,
            counsellorId: patient.assignedCounsellorId,
            type: 'MISSED_TWO_DAYS',
            status: 'PENDING',
            details: `Patient has missed medicine check-in for 2 consecutive days (${d2Str} and ${d1Str}). Proactive supportive outreach advised.`,
          },
        });
        tasksCreated++;
      }
    }
  }

  if (tasksCreated > 0) {
    logger.info({ count: tasksCreated }, 'Created counsellor tasks for 2-day missed check-ins');
  }
  return tasksCreated;
}

/**
 * Initializes all cron schedules
 */
export function initializeScheduler(): void {
  // Reminder checks: Run every minute
  nodeCron.schedule('* * * * *', async () => {
    try {
      await dispatchScheduledReminders();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error in reminder scheduler');
    }
  });

  // Consecutive miss checks: Run every morning at 10:00 AM
  nodeCron.schedule('0 10 * * *', async () => {
    try {
      await checkConsecutiveMissesAndEscalate();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error in consecutive miss escalation job');
    }
  });

  // Nightly risk score recomputation: Run at 01:00 AM
  nodeCron.schedule('0 1 * * *', async () => {
    try {
      await recomputeAllPatientsRisk();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error in nightly risk recomputation job');
    }
  });

  // Photo retention cleanup: Run daily at 03:00 AM (older than 30 days)
  nodeCron.schedule('0 3 * * *', async () => {
    try {
      const deleted = await cleanupExpiredPhotos(30);
      if (deleted > 0) {
        logger.info({ deletedCount: deleted }, 'Cleaned up expired check-in photos (>30 days)');
      }
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error in photo cleanup job');
    }
  });

  logger.info('Scheduler and background job workers initialized');
}
