import { Router } from 'express';
import {
  requestOtp,
  verifyOtp,
  setPin,
  loginPin,
  refreshPatientToken,
  logoutPatient,
  getTodayStatus,
  submitCheckin,
  reportSideEffects,
  getCalendar,
  getPreferences,
  updatePreferences,
  submitHelpRequest,
} from '../controllers/patient.controller.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { requireJwtAuth } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { enforcePatientPrivacy } from '../utils/privacyFilter.js';
import { upload } from '../services/photo.service.js';

const router = Router();

// Layer 1 Auth: API key must have 'frontend' scope
router.use(requireApiKey(['frontend']));

// Privacy Filter: Sanitizes all patient-facing responses
router.use(enforcePatientPrivacy);

// Public Patient Auth Endpoints
router.post('/auth/request-otp', authRateLimiter, requestOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/login-pin', authRateLimiter, loginPin);
router.post('/auth/refresh', refreshPatientToken);
router.post('/auth/logout', logoutPatient);

// Protected Patient Endpoints (Require JWT Layer 2 Auth)
router.use(requireJwtAuth);
router.use(requireRole(['patient']));

router.post('/auth/set-pin', setPin);
router.get('/today', getTodayStatus);
router.post('/checkins', upload.single('photo'), submitCheckin);
router.post('/side-effects', reportSideEffects);
router.get('/calendar', getCalendar);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/help-request', submitHelpRequest);

export default router;
