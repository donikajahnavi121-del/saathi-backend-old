import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Enforces allowed user roles
 */
export function requireRole(allowedRoles: ('patient' | 'counsellor' | 'supervisor')[]) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(
        res,
        401,
        'UNAUTHORIZED',
        'auth.unauthorized',
        'Authentication required.'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        'FORBIDDEN_ROLE',
        'auth.forbidden_role',
        `Role ${req.user.role} does not have permission for this resource.`
      );
    }

    return next();
  };
}

/**
 * Verifies that the counsellor is assigned to the patient being accessed,
 * or allows full access if user is a supervisor.
 */
export async function requireAssignedPatient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'auth.unauthorized', 'Authentication required.');
  }

  // Supervisors have cohort-wide access
  if (req.user.role === 'supervisor') {
    return next();
  }

  const patientIdOrCode = req.params.id || req.params.patientId;
  if (!patientIdOrCode) {
    return next();
  }

  try {
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [{ id: patientIdOrCode }, { code: patientIdOrCode }],
      },
      select: {
        id: true,
        code: true,
        assignedCounsellorId: true,
      },
    });

    if (!patient) {
      return sendError(
        res,
        404,
        'PATIENT_NOT_FOUND',
        'patient.not_found',
        'Patient not found.'
      );
    }

    if (patient.assignedCounsellorId !== req.user.id) {
      return sendError(
        res,
        403,
        'FORBIDDEN_UNASSIGNED_PATIENT',
        'counsellor.not_assigned',
        'Access denied: You are not the assigned counsellor for this patient.'
      );
    }

    // Attach resolved patient ID to request
    (req as any).targetPatientId = patient.id;
    return next();
  } catch (error) {
    return sendError(
      res,
      500,
      'SERVER_ERROR',
      'common.server_error',
      'Failed to verify patient assignment.'
    );
  }
}
