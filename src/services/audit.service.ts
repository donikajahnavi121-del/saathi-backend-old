import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

export interface AuditLogParams {
  userId?: string;
  userRole?: string;
  action: 'FULL_PHONE_VIEW' | 'CALL_INITIATED' | 'PATIENT_ENROLLED' | 'PATIENT_UPDATED' | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'FOLLOWUP_LOGGED';
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userRole: params.userRole || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, action: params.action }, 'Failed to write audit log to database');
  }
}
