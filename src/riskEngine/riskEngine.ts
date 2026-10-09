import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { IRiskEngine, RiskEngineResult } from './types.js';
import { RuleBasedRiskEngine } from './ruleEngine.js';
import { logger } from '../utils/logger.js';

// Pluggable engine instance (can be swapped with Python ML adapter)
let activeRiskEngine: IRiskEngine = new RuleBasedRiskEngine();

export function setRiskEngine(engine: IRiskEngine): void {
  activeRiskEngine = engine;
}

export function getRiskEngine(): IRiskEngine {
  return activeRiskEngine;
}

/**
 * Recomputes and persists risk score for a single patient,
 * and clears related counsellor queue caches.
 */
export async function recomputePatientRisk(patientId: string): Promise<RiskEngineResult> {
  try {
    const result = await activeRiskEngine.computeRisk(patientId);

    // Save risk score record in DB
    await prisma.riskScore.create({
      data: {
        patientId,
        score: result.score,
        level: result.level,
        topReasons: JSON.stringify(result.topReasons),
        priorityScore: result.priorityScore,
        suggestedAction: result.suggestedAction,
        flagSummary: result.flagSummary,
        modelVersion: result.modelVersion,
        computedAt: new Date(),
      },
    });

    // Invalidate queue and dashboard caches
    await redis.del('dashboard:summary:*');
    await redis.del(`patient:flagged:${patientId}`);

    return result;
  } catch (error: any) {
    logger.error({ error: error.message, patientId }, 'Failed to recompute patient risk');
    throw error;
  }
}

/**
 * Recomputes risk scores across all active patients (Nightly BullMQ / cron job)
 */
export async function recomputeAllPatientsRisk(): Promise<{ processed: number; errors: number }> {
  const patients = await prisma.patient.findMany({ select: { id: true } });
  let processed = 0;
  let errors = 0;

  for (const p of patients) {
    try {
      await recomputePatientRisk(p.id);
      processed++;
    } catch {
      errors++;
    }
  }

  logger.info({ processed, errors }, 'Completed nightly risk recomputation batch');
  return { processed, errors };
}
