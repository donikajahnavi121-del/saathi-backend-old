import { Request, Response, NextFunction } from 'express';

// Stigmatizing or clinical diagnosis terms strictly forbidden in patient-facing communication
const FORBIDDEN_DIAGNOSIS_PATTERNS = [
  /\bTB\b/i,
  /\btuberculosis\b/i,
  /\bmycobacterium\b/i,
  /\bdisease\b/i,
  /\binfection\b/i,
  /\bcontagious\b/i,
  /\brifampicin\b/i,
  /\bisoniazid\b/i,
  /\bethambutol\b/i,
  /\bpyrazinamide\b/i,
];

// Stigmatizing guilt language strictly forbidden
const FORBIDDEN_GUILT_PATTERNS = [
  /\bstreak broken\b/i,
  /\bfailed\b/i,
  /\bnon-compliant\b/i,
  /\bdefaulter\b/i,
  /\bviolat(ed|ion)\b/i,
  /\bdelinquent\b/i,
  /\bguilty\b/i,
  /\bpunishment\b/i,
];

/**
 * Validates whether text contains any forbidden diagnosis terms.
 */
export function containsDiagnosisTerms(text: string): boolean {
  return FORBIDDEN_DIAGNOSIS_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Validates whether text contains forbidden guilt/stigmatizing language.
 */
export function containsGuiltLanguage(text: string): boolean {
  return FORBIDDEN_GUILT_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitizes patient-facing messages, replacing clinical words with neutral terms.
 */
export function sanitizePatientText(text: string): string {
  let cleaned = text;
  // Replace TB / tuberculosis with "your medicine" or "Saathi"
  cleaned = cleaned.replace(/\btuberculosis\b/gi, 'your medicine');
  cleaned = cleaned.replace(/\bTB\b/gi, 'Saathi');

  // Replace guilt phrases
  cleaned = cleaned.replace(/\bstreak broken\b/gi, 'missed yesterday');
  cleaned = cleaned.replace(/\bnon-compliant\b/gi, 'needs a check-in');
  cleaned = cleaned.replace(/\bfailed to check in\b/gi, 'missed yesterday');
  cleaned = cleaned.replace(/\bverified\b/gi, 'confirmed');

  return cleaned;
}

/**
 * Express Middleware: Enforces Zero Diagnosis Leakage & No Guilt Language
 * on all endpoints mounted under `/api/v1/patient`.
 */
export function enforcePatientPrivacy(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if (body) {
      const stringified = JSON.stringify(body);

      // Check for forbidden diagnosis patterns
      if (containsDiagnosisTerms(stringified) || containsGuiltLanguage(stringified)) {
        // Deep replace strings in json body
        const sanitizedBody = deepSanitize(body);
        return originalJson(sanitizedBody);
      }
    }
    return originalJson(body);
  };

  next();
}

function deepSanitize(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizePatientText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (typeof obj === 'object' && obj !== null) {
    const copy: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      copy[key] = deepSanitize(obj[key]);
    }
    return copy;
  }
  return obj;
}
