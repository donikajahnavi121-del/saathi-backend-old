export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FlagReason {
  text: string;
  impact: number; // 0 - 100 percentage weight
}

export interface FeatureContribution {
  featureName: string;
  rawVal: any;
  contributionScore: number; // Raw points contributed
  impactPercentage: number;   // Normalized impact percentage among active factors
  templateKey: string;
}

export interface RiskEngineResult {
  score: number; // 0 - 100
  level: RiskLevel;
  priorityScore: number;
  topReasons: FlagReason[];
  suggestedAction: string;
  flagSummary: string;
  modelVersion: string;
  featureContributions: FeatureContribution[];
}

export interface IRiskEngine {
  readonly modelVersion: string;
  computeRisk(patientId: string): Promise<RiskEngineResult>;
}
