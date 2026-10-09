import request from 'supertest';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { generateTokens } from '../src/services/token.service.js';
import { redis } from '../src/config/redis.js';

describe('Check-in Idempotency Protection', () => {
  const feApiKey = ENV.FRONTEND_API_KEY;
  let patientToken: string;

  beforeAll(async () => {
    // Generate valid patient session
    const tokens = await generateTokens({
      id: 'patient-idempotent-test',
      role: 'patient',
      code: 'P-IDEMP',
    });
    patientToken = tokens.accessToken;
  });

  it('should return idempotent response when submitting identical Idempotency-Key', async () => {
    const idempotencyKey = `idemp-test-${Date.now()}`;

    // First request
    const res1 = await request(app)
      .post('/api/v1/patient/checkins')
      .set('x-api-key', feApiKey)
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ method: 'photo' });

    expect([200, 201]).toContain(res1.status);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.messageKey).toBe('patient.checkin_saved');

    // Second request with exact same Idempotency-Key
    const res2 = await request(app)
      .post('/api/v1/patient/checkins')
      .set('x-api-key', feApiKey)
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ method: 'photo' });

    // Must return matching status and payload without duplicating
    expect([200, 201]).toContain(res2.status);
    expect(res2.body.data.checkinId).toBe(res1.body.data.checkinId);
    expect(res2.body.data.date).toBe(res1.body.data.date);
  });
});
