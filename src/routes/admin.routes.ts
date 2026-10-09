import { Router } from 'express';
import {
  enrolPatient,
  listPatients,
  createCounsellor,
  listCounsellors,
  bulkReassign,
  getProgrammeSummary,
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from '../controllers/admin.controller.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { requireJwtAuth } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Layer 1 Auth: API key must have 'admin_tool' scope
router.use(requireApiKey(['admin_tool']));

// Layer 2 Auth: Requires Supervisor Role
router.use(requireJwtAuth);
router.use(requireRole(['supervisor']));

// Patient Enrolment & Management
router.post('/patients', enrolPatient);
router.get('/patients', listPatients);

// Counsellor Management & Workload Balancing
router.post('/counsellors', createCounsellor);
router.get('/counsellors', listCounsellors);
router.post('/patients/bulk-reassign', bulkReassign);

// Programme Summary & Analytics
router.get('/programme-summary', getProgrammeSummary);

// API Key Lifecycle Management
router.post('/api-keys', createApiKey);
router.get('/api-keys', listApiKeys);
router.post('/api-keys/:id/revoke', revokeApiKey);

export default router;
