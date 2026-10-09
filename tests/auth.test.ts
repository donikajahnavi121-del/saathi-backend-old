import request from 'supertest';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { redis } from '../src/config/redis.js';

describe('Layer 1 & Layer 2 Authentication and PIN Security', () => {
  const validApiKey = ENV.FRONTEND_API_KEY;

  describe('Layer 1: API Key Validation (x-api-key)', () => {
    it('should reject request without x-api-key with 401', async () => {
      const res = await request(app).get('/api/v1/patient/today');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_API_KEY');
    });

    it('should reject invalid x-api-key with 401', async () => {
      const res = await request(app)
        .get('/api/v1/patient/today')
        .set('x-api-key', 'invalid_fake_key_12345');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_API_KEY');
    });

    it('should allow valid x-api-key to reach Layer 2 auth', async () => {
      const res = await request(app)
        .get('/api/v1/patient/today')
        .set('x-api-key', validApiKey);
      // Fails at Layer 2 (JWT missing), proving Layer 1 passed
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Layer 2: Patient OTP Flow', () => {
    const testPhone = '9412378901';

    it('should request OTP and return success', async () => {
      const res = await request(app)
        .post('/api/v1/patient/auth/request-otp')
        .set('x-api-key', validApiKey)
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messageKey).toBe('auth.otp_sent');
    });

    it('should reject invalid OTP with 401', async () => {
      const res = await request(app)
        .post('/api/v1/patient/auth/verify-otp')
        .set('x-api-key', validApiKey)
        .send({ phone: testPhone, otp: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_OTP');
    });

    it('should verify correct OTP and return tokens', async () => {
      // Dev/mock OTP is 123456
      const res = await request(app)
        .post('/api/v1/patient/auth/verify-otp')
        .set('x-api-key', validApiKey)
        .send({ phone: testPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
  });

  describe('PIN Lockout Security (5 Failed Attempts -> 15 min lock)', () => {
    const testPhone = '9999999999';

    beforeAll(async () => {
      // Clear Redis test keys
      await redis.del(`failed_attempts:pin:*`);
      await redis.del(`lockout:pin:*`);
    });

    it('should enforce lockout on 5 consecutive wrong PIN attempts', async () => {
      // First, create patient with PIN
      const otpRes = await request(app)
        .post('/api/v1/patient/auth/verify-otp')
        .set('x-api-key', validApiKey)
        .send({ phone: testPhone, otp: '123456' });

      const token = otpRes.body.data.accessToken;

      // Set PIN 4321
      await request(app)
        .post('/api/v1/patient/auth/set-pin')
        .set('x-api-key', validApiKey)
        .set('Authorization', `Bearer ${token}`)
        .send({ pin: '4321' });

      // Now attempt 5 wrong logins
      for (let i = 1; i <= 4; i++) {
        const attemptRes = await request(app)
          .post('/api/v1/patient/auth/login-pin')
          .set('x-api-key', validApiKey)
          .send({ phone: testPhone, pin: '0000' });

        expect(attemptRes.status).toBe(401);
        expect(attemptRes.body.code).toBe('INVALID_PIN');
      }

      // 5th attempt triggers lockout
      const fifthRes = await request(app)
        .post('/api/v1/patient/auth/login-pin')
        .set('x-api-key', validApiKey)
        .send({ phone: testPhone, pin: '0000' });

      expect(fifthRes.status).toBe(423);
      expect(fifthRes.body.code).toBe('PIN_LOCKED');

      // Subsequent attempt remains locked
      const sixthRes = await request(app)
        .post('/api/v1/patient/auth/login-pin')
        .set('x-api-key', validApiKey)
        .send({ phone: testPhone, pin: '4321' });

      expect(sixthRes.status).toBe(423);
      expect(sixthRes.body.code).toBe('PIN_LOCKED');
    });
  });
});
