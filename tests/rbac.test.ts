import request from 'supertest';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { generateTokens } from '../src/services/token.service.js';

describe('Role-Based Access Control (RBAC) & Patient Isolation', () => {
  const feApiKey = ENV.FRONTEND_API_KEY;
  const adminApiKey = ENV.ADMIN_API_KEY;

  let patientToken: string;
  let counsellor1Token: string;
  let counsellor2Token: string;
  let supervisorToken: string;

  beforeAll(async () => {
    // Generate test tokens with distinct roles and IDs
    const pTokens = await generateTokens({
      id: 'mock-patient-id',
      role: 'patient',
      code: 'P-9999',
    });
    patientToken = pTokens.accessToken;

    const c1Tokens = await generateTokens({
      id: 'counsellor-1-id',
      role: 'counsellor',
      email: 'c1@saathi.care',
    });
    counsellor1Token = c1Tokens.accessToken;

    const c2Tokens = await generateTokens({
      id: 'counsellor-2-id',
      role: 'counsellor',
      email: 'c2@saathi.care',
    });
    counsellor2Token = c2Tokens.accessToken;

    const sTokens = await generateTokens({
      id: 'supervisor-id',
      role: 'supervisor',
      email: 'sup@saathi.care',
    });
    supervisorToken = sTokens.accessToken;
  });

  it('should deny patient access to counsellor dashboard (403)', async () => {
    const res = await request(app)
      .get('/api/v1/counsellor/dashboard')
      .set('x-api-key', feApiKey)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('should deny counsellor access to supervisor admin endpoints (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/programme-summary')
      .set('x-api-key', adminApiKey)
      .set('Authorization', `Bearer ${counsellor1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('should allow supervisor access to admin endpoints (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/programme-summary')
      .set('x-api-key', adminApiKey)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });
});
