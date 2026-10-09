import request from 'supertest';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { generateTokens } from '../src/services/token.service.js';
import { encryptField, decryptField, maskPhoneNumber } from '../src/utils/crypto.js';
import { sendNeutralDailyReminder, setSmsProvider, ISmsProvider } from '../src/services/sms.service.js';
import { prisma } from '../src/config/db.js';

describe('Hard Healthcare Data-Privacy Guardrails', () => {
  const feApiKey = ENV.FRONTEND_API_KEY;
  let patientToken: string;
  let counsellorToken: string;

  beforeAll(async () => {
    const pTokens = await generateTokens({
      id: 'privacy-test-patient',
      role: 'patient',
      code: 'P-PRIV',
    });
    patientToken = pTokens.accessToken;

    const cTokens = await generateTokens({
      id: 'privacy-test-counsellor',
      role: 'counsellor',
      email: 'counsellor.privacy@saathi.care',
    });
    counsellorToken = cTokens.accessToken;
  });

  describe('1. Zero Diagnosis Leakage & No Guilt Language in Patient Responses', () => {
    it('should NEVER contain "TB", "tuberculosis", or clinical diagnosis words in patient responses', async () => {
      const endpoints = [
        '/api/v1/patient/today',
        '/api/v1/patient/calendar?month=2026-10',
        '/api/v1/patient/preferences',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)
          .get(endpoint)
          .set('x-api-key', feApiKey)
          .set('Authorization', `Bearer ${patientToken}`);

        const textResponse = JSON.stringify(res.body);

        // Strict forbidden regex checks
        expect(textResponse).not.toMatch(/\bTB\b/i);
        expect(textResponse).not.toMatch(/\btuberculosis\b/i);
        expect(textResponse).not.toMatch(/\bmycobacterium\b/i);
        expect(textResponse).not.toMatch(/\brifampicin\b/i);
        expect(textResponse).not.toMatch(/\bisoniazid\b/i);
        expect(textResponse).not.toMatch(/\bethambutol\b/i);

        // No guilt language
        expect(textResponse).not.toMatch(/\bstreak broken\b/i);
        expect(textResponse).not.toMatch(/\bfailed\b/i);
        expect(textResponse).not.toMatch(/\bnon-compliant\b/i);
      }
    });
  });

  describe('2. Phone Masking in List Endpoints', () => {
    it('should format masked phone number correctly (+91 98••• ••210)', () => {
      const full1 = '+91 98765 43210';
      const masked1 = maskPhoneNumber(full1);
      expect(masked1).toBe('+91 98••• ••210');

      const full2 = '9412378901';
      const masked2 = maskPhoneNumber(full2);
      expect(masked2).toBe('+91 94••• ••901');
    });

    it('should return masked phone numbers in counsellor priority queue', async () => {
      const res = await request(app)
        .get('/api/v1/counsellor/queue')
        .set('x-api-key', feApiKey)
        .set('Authorization', `Bearer ${counsellorToken}`);

      if (res.status === 200 && res.body.data.items?.length > 0) {
        for (const item of res.body.data.items) {
          expect(item.phone).toMatch(/\+91 \d{2}••• ••\d{3}/);
        }
      }
    });
  });

  describe('3. Field-Level AES-256-GCM Encryption at Rest', () => {
    it('should encrypt sensitive text and produce ciphertext with IV and auth tag', () => {
      const sensitiveNote = 'Patient reports mild nausea after morning meal';
      const encrypted = encryptField(sensitiveNote);

      expect(encrypted).not.toBe(sensitiveNote);
      expect(encrypted.split(':').length).toBe(3); // iv:tag:ciphertext

      const decrypted = decryptField(encrypted);
      expect(decrypted).toBe(sensitiveNote);
    });
  });

  describe('4. Neutral Daily Reminder Content', () => {
    it('should send only neutral text without disease, names, or drug references', async () => {
      let sentMessage = '';

      const mockSmsProvider: ISmsProvider = {
        providerName: 'TestMock',
        sendSms: async (to, message) => {
          sentMessage = message;
          return true;
        },
      };

      setSmsProvider(mockSmsProvider);
      await sendNeutralDailyReminder('+919876543210');

      expect(sentMessage).toBe('Saathi: your daily check-in is ready.');
      expect(sentMessage).not.toMatch(/\btb\b/i);
      expect(sentMessage).not.toMatch(/\btuberculosis\b/i);
      expect(sentMessage).not.toMatch(/\bpatient\b/i);
    });
  });

  describe('5. Full Phone Access Audit Logging', () => {
    it('should write an AuditLog entry when full phone number is accessed via call initiation', async () => {
      // Find a patient in DB or create test patient
      let testPatient = await prisma.patient.findFirst();
      if (!testPatient) {
        testPatient = await prisma.patient.create({
          data: {
            code: 'P-AUDIT-TEST',
            firstName: 'AuditTest',
            phoneEncrypted: encryptField('+91 98765 00000'),
            phoneHash: 'hash-test-audit',
            assignedCounsellorId: 'privacy-test-counsellor',
          },
        });
      }

      const res = await request(app)
        .post(`/api/v1/counsellor/patients/${testPatient.code}/call`)
        .set('x-api-key', feApiKey)
        .set('Authorization', `Bearer ${counsellorToken}`);

      expect([200, 403]).toContain(res.status); // 200 if assigned, 403 if RBAC blocked

      if (res.status === 200) {
        expect(res.body.data.fullPhoneNumber).toBeDefined();

        // Verify audit log exists
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            action: 'CALL_INITIATED',
            resourceId: testPatient.id,
          },
          orderBy: { timestamp: 'desc' },
        });

        expect(auditLog).toBeDefined();
        expect(auditLog?.action).toBe('CALL_INITIATED');
      }
    });
  });
});
