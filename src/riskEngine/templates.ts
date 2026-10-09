import { FeatureContribution, FlagReason, RiskLevel } from './types.js';

export interface ReasonTemplateMap {
  [featureKey: string]: (contrib: FeatureContribution) => string;
}

export const REASON_TEMPLATES: ReasonTemplateMap = {
  missed_last_3: (c) => `Missed ${c.rawVal} check-in${c.rawVal > 1 ? 's' : ''} in last 3 days`,
  missed_last_7: (c) => `Missed ${c.rawVal} check-in${c.rawVal > 1 ? 's' : ''} in last 7 days`,
  consecutive_misses: (c) => `${c.rawVal} consecutive missed medicine days`,
  side_effects: (c) => `Reported side effects (${Array.isArray(c.rawVal) ? c.rawVal.join(', ') : 'recent symptoms'})`,
  unreachable_phone: (c) => `Phone unreachable (${c.rawVal} unanswered attempt${c.rawVal > 1 ? 's' : ''})`,
  delayed_submission: (c) => `Average ${Math.round(c.rawVal)}-hour delay in daily check-in`,
  distance_clinic: (c) => `Lives far from health centre (${c.rawVal.toFixed(1)} km)`,
  intensive_phase: (c) => `Intensive Phase Month ${c.rawVal} critical window`,
  no_contact: (c) => `No counsellor contact for ${c.rawVal} days`,
  method_change: () => `Shifted away from daily photo check-ins`,
};

export function formatReasons(contributions: FeatureContribution[]): FlagReason[] {
  // Sort contributions descending by points
  const sorted = [...contributions].sort((a, b) => b.contributionScore - a.contributionScore);

  const totalScore = sorted.reduce((sum, item) => sum + item.contributionScore, 0) || 1;

  return sorted.slice(0, 4).map((item) => {
    const formatter = REASON_TEMPLATES[item.featureName] || (() => `${item.featureName} flagged`);
    const impact = Math.min(100, Math.max(10, Math.round((item.contributionScore / totalScore) * 100)));
    return {
      text: formatter(item),
      impact,
    };
  });
}

export function generateSuggestedAction(level: RiskLevel, topFeatureName?: string): string {
  if (topFeatureName === 'side_effects') {
    return 'Call today to review symptoms and verify tolerance.';
  }
  if (topFeatureName === 'unreachable_phone') {
    return 'Immediate home visit or alternate family contact call.';
  }
  if (topFeatureName === 'consecutive_misses' || topFeatureName === 'missed_last_3') {
    return 'Call patient today to provide reassurance and check if refill is needed.';
  }
  if (topFeatureName === 'delayed_submission') {
    return 'Send encouraging morning reminder to re-anchor routine.';
  }
  if (topFeatureName === 'distance_clinic') {
    return 'Coordinate nearest community health worker delivery for next refill.';
  }

  if (level === 'HIGH') {
    return 'Prioritize immediate telephone check-in before end of day.';
  }
  if (level === 'MEDIUM') {
    return 'Send friendly reminder & check if refill is needed.';
  }
  return 'Send monthly encouraging acknowledgement message.';
}

export function generateFlagSummary(level: RiskLevel, reasons: FlagReason[]): string {
  if (level === 'HIGH') {
    return `High probability of discontinuation in next 7 days based on recent check-in gap and reported barriers.`;
  }
  if (level === 'MEDIUM') {
    return `Medium risk: Baseline adherence requires proactive check-in to prevent cumulative missed doses.`;
  }
  return `Good baseline adherence. Routine digital companion support active.`;
}
