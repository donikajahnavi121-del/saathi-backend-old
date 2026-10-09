import { prisma } from '../config/db.js';
import { IRiskEngine, RiskEngineResult, FeatureContribution, RiskLevel } from './types.js';
import { formatReasons, generateSuggestedAction, generateFlagSummary } from './templates.js';

export class RuleBasedRiskEngine implements IRiskEngine {
  public readonly modelVersion = 'rule-v1.0';

  async computeRisk(patientId: string): Promise<RiskEngineResult> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        checkins: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        sideEffectReports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        followups: {
          orderBy: { loggedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const contributions: FeatureContribution[] = [];

    // Helper: calculate date string from N days ago
    const now = new Date();
    const getDateAgoStr = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10);
    };

    const d3Str = getDateAgoStr(3);
    const d7Str = getDateAgoStr(7);
    const d14Str = getDateAgoStr(14);

    // 1 & 2 & 3. Missed check-ins in last 3, 7, 14 days
    // Map existing check-in dates
    const checkinDateMap = new Set(
      patient.checkins.filter((c) => c.status === 'CHECKED_IN').map((c) => c.date)
    );

    let missedLast3 = 0;
    for (let i = 1; i <= 3; i++) {
      if (!checkinDateMap.has(getDateAgoStr(i))) missedLast3++;
    }

    let missedLast7 = 0;
    for (let i = 1; i <= 7; i++) {
      if (!checkinDateMap.has(getDateAgoStr(i))) missedLast7++;
    }

    let missedLast14 = 0;
    for (let i = 1; i <= 14; i++) {
      if (!checkinDateMap.has(getDateAgoStr(i))) missedLast14++;
    }

    if (missedLast3 > 0) {
      contributions.push({
        featureName: 'missed_last_3',
        rawVal: missedLast3,
        contributionScore: missedLast3 * 15,
        impactPercentage: 0,
        templateKey: 'missed_last_3',
      });
    }

    if (missedLast7 > missedLast3) {
      const extra7 = missedLast7 - missedLast3;
      contributions.push({
        featureName: 'missed_last_7',
        rawVal: missedLast7,
        contributionScore: extra7 * 10,
        impactPercentage: 0,
        templateKey: 'missed_last_7',
      });
    }

    // 4. Consecutive misses from yesterday backwards
    let consecutiveMisses = 0;
    for (let i = 1; i <= 14; i++) {
      if (!checkinDateMap.has(getDateAgoStr(i))) {
        consecutiveMisses++;
      } else {
        break;
      }
    }

    if (consecutiveMisses >= 2) {
      contributions.push({
        featureName: 'consecutive_misses',
        rawVal: consecutiveMisses,
        contributionScore: consecutiveMisses * 14,
        impactPercentage: 0,
        templateKey: 'consecutive_misses',
      });
    }

    // 5. Reported side effects (past 14 days)
    const recentSideEffects = patient.sideEffectReports.filter(
      (r) => now.getTime() - r.createdAt.getTime() <= 14 * 86400000
    );
    if (recentSideEffects.length > 0) {
      const hasSevere = recentSideEffects.some((r) => r.severityFlag);
      const allSymptoms: string[] = [];
      recentSideEffects.forEach((r) => {
        try {
          const symList = JSON.parse(r.symptoms);
          if (Array.isArray(symList)) allSymptoms.push(...symList);
        } catch {}
      });

      contributions.push({
        featureName: 'side_effects',
        rawVal: Array.from(new Set(allSymptoms)),
        contributionScore: hasSevere ? 28 : 16,
        impactPercentage: 0,
        templateKey: 'side_effects',
      });
    }

    // 6. Days since last contact
    let daysSinceContact = 7;
    if (patient.lastContactAt) {
      daysSinceContact = Math.floor(
        (now.getTime() - patient.lastContactAt.getTime()) / (1000 * 3600 * 24)
      );
    } else if (patient.followups.length > 0) {
      daysSinceContact = Math.floor(
        (now.getTime() - patient.followups[0].loggedAt.getTime()) / (1000 * 3600 * 24)
      );
    }

    if (daysSinceContact >= 4) {
      contributions.push({
        featureName: 'no_contact',
        rawVal: daysSinceContact,
        contributionScore: Math.min(25, (daysSinceContact - 3) * 4),
        impactPercentage: 0,
        templateKey: 'no_contact',
      });
    }

    // 7. Unreachable phone attempts (NO_ANSWER outcomes)
    const unansweredCalls = patient.followups.filter((f) => f.outcome === 'NO_ANSWER').length;
    if (unansweredCalls > 0) {
      contributions.push({
        featureName: 'unreachable_phone',
        rawVal: unansweredCalls,
        contributionScore: unansweredCalls * 20,
        impactPercentage: 0,
        templateKey: 'unreachable_phone',
      });
    }

    // 8. Distance to clinic
    if (patient.distanceToClinicKm > 4.0) {
      contributions.push({
        featureName: 'distance_clinic',
        rawVal: patient.distanceToClinicKm,
        contributionScore: Math.min(20, Math.round((patient.distanceToClinicKm - 3.0) * 3)),
        impactPercentage: 0,
        templateKey: 'distance_clinic',
      });
    }

    // 9. Intensive phase month 1-2 critical window
    if (patient.phase === 'INTENSIVE' && patient.monthNumber <= 2) {
      contributions.push({
        featureName: 'intensive_phase',
        rawVal: patient.monthNumber,
        contributionScore: 18,
        impactPercentage: 0,
        templateKey: 'intensive_phase',
      });
    }

    // Total raw risk score clamped between 0 and 100
    const rawTotal = contributions.reduce((sum, c) => sum + c.contributionScore, 0);
    const score = Math.min(98, Math.max(12, rawTotal));

    let level: RiskLevel = 'LOW';
    if (score >= 70) {
      level = 'HIGH';
    } else if (score >= 40) {
      level = 'MEDIUM';
    }

    // Calculate urgency:
    // urgency = (daysSinceContact * 2.5) + (overdueFollowUp ? 15 : 0) + (consecutiveMisses * 5)
    const latestFollowup = patient.followups[0];
    const isOverdueFollowup =
      latestFollowup?.nextFollowupDate &&
      new Date(latestFollowup.nextFollowupDate) < now;

    const urgency =
      daysSinceContact * 2.5 +
      (isOverdueFollowup ? 15 : 0) +
      consecutiveMisses * 5;

    const priorityScore = parseFloat((score + urgency).toFixed(1));

    // Reasons and recommendations
    const topReasons = formatReasons(contributions);
    const topFeatureName = contributions[0]?.featureName;
    const suggestedAction = generateSuggestedAction(level, topFeatureName);
    const flagSummary = generateFlagSummary(level, topReasons);

    return {
      score,
      level,
      priorityScore,
      topReasons,
      suggestedAction,
      flagSummary,
      modelVersion: this.modelVersion,
      featureContributions: contributions,
    };
  }
}
