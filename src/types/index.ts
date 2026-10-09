export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface FlagReason {
  text: string;
  impact: number; // 0 - 100 percentage bar
}

export interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  type: 'check_in' | 'missed' | 'call' | 'side_effect';
  title: string;
  description: string;
  photoUrl?: string;
  outcome?: string;
  notes?: string;
}

export interface Patient {
  id: string; // e.g. "P-0142"
  name: string; // e.g. "Anita Sharma"
  firstName: string;
  phone: string;
  age: number;
  gender: string;
  treatmentPhase: string; // e.g. "Continuation Phase - Month 4"
  regimen: string; // e.g. "4-FDC Daily"
  phcLocation: string; // Primary Health Centre
  riskBand: RiskLevel;
  riskScore: number; // 0 - 100
  oneLineReason: string; // e.g. "3 missed in last 5 days"
  lastContact: string; // e.g. "2 days ago"
  adherencePercentage: number; // e.g. 76%
  currentStreak: number;
  checkedInToday: boolean;
  missedYesterday: boolean;
  flagSummary: string;
  reasons: FlagReason[];
  suggestedAction: string;
  timeline: TimelineEvent[];
}

export interface FollowUpLog {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  outcome: 'Reached' | 'No answer' | 'Refused';
  notes: string;
  nextFollowUpDate: string;
  loggedAt: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';

export type TextSize = 'small' | 'medium' | 'large';

export type PatientScreen =
  | 'home'
  | 'home_missed'
  | 'checkin_camera'
  | 'checkin_review'
  | 'checkin_success'
  | 'side_effects'
  | 'history'
  | 'help_language'
  | 'sign_in';

export type CounsellorScreen =
  | 'dashboard'
  | 'patients'
  | 'priority_queue'
  | 'patient_profile'
  | 'follow_ups'
  | 'reports';
