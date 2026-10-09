import { Router } from 'express';
import {
  counsellorLogin,
  counsellorLogout,
  getDashboard,
  getPriorityQueue,
  getPatientProfile,
  getWhyFlagged,
  getRiskTrend,
  logFollowup,
  getContactHistory,
  initiatePatientCall,
} from '../controllers/counsellor.controller.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { requireJwtAuth } from '../middleware/jwtAuth.js';
import { requireRole, requireAssignedPatient } from '../middleware/rbac.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Layer 1 Auth: API key must have 'frontend' scope
router.use(requireApiKey(['frontend']));

// Public Login Endpoint
router.post('/auth/login', authRateLimiter, counsellorLogin);
router.post('/auth/logout', counsellorLogout);

// Protected Counsellor Routes (Layer 2 Auth: Counsellor or Supervisor)
router.use(requireJwtAuth);
router.use(requireRole(['counsellor', 'supervisor']));

// Cohort & Queue Endpoints
router.get('/dashboard', getDashboard);
router.get('/queue', getPriorityQueue);

// Patient Specific Endpoints (Protected by Patient Assignment check)
router.get('/patients/:id', requireAssignedPatient, getPatientProfile);
router.get('/patients/:id/why-flagged', requireAssignedPatient, getWhyFlagged);
router.get('/patients/:id/risk-trend', requireAssignedPatient, getRiskTrend);
router.post('/patients/:id/followups', requireAssignedPatient, logFollowup);
router.get('/patients/:id/contact-history', requireAssignedPatient, getContactHistory);
router.post('/patients/:id/call', requireAssignedPatient, initiatePatientCall);

export default router;
