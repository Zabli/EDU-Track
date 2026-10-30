import { UserSessionData } from '@/lib/auth/session';

export class AuthorizationError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'FORBIDDEN', statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Validates that the user is an active Platform Administrator.
 */
export function assertPlatformAdmin(user: UserSessionData | null): void {
  if (!user) {
    throw new AuthorizationError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (user.platformRole !== 'platform_admin' || user.accountStatus !== 'active') {
    throw new AuthorizationError('Platform Administrator privilege required.', 'REQUIRES_PLATFORM_ADMIN', 403);
  }
}

/**
 * Validates that the user has authorized access to the target academy.
 * Platform Admin has platform-wide access.
 * Academy Owner can only access their own active academy.
 */
export function assertAcademyAccess(user: UserSessionData | null, targetAcademyId: string): void {
  if (!user) {
    throw new AuthorizationError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (user.accountStatus !== 'active') {
    throw new AuthorizationError('Account is inactive or suspended.', 'ACCOUNT_SUSPENDED', 403);
  }
  if (user.platformRole === 'platform_admin') {
    return; // Platform Admin has platform-wide access
  }
  if (user.academyId !== targetAcademyId) {
    throw new AuthorizationError(
      'Cross-academy access denied. You cannot view or modify data outside your academy.',
      'CROSS_ACADEMY_ACCESS_DENIED',
      403
    );
  }
  if (user.role !== 'owner') {
    throw new AuthorizationError(
      'Academy Owner permissions required for institutional management.',
      'REQUIRES_ACADEMY_OWNER',
      403
    );
  }
}

/**
 * Validates that a teacher is assigned to the target batch/class.
 */
export function assertTeacherClassAccess(
  user: UserSessionData | null,
  targetAcademyId: string,
  targetBatchId: string,
  assignedBatchIds: string[]
): void {
  if (!user) {
    throw new AuthorizationError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (user.accountStatus !== 'active') {
    throw new AuthorizationError('Account is inactive or suspended.', 'ACCOUNT_SUSPENDED', 403);
  }
  if (user.platformRole === 'platform_admin') {
    return;
  }
  if (user.academyId !== targetAcademyId) {
    throw new AuthorizationError('Cross-academy access denied.', 'CROSS_ACADEMY_ACCESS_DENIED', 403);
  }
  // Owners can oversee all classes in their academy
  if (user.role === 'owner') {
    return;
  }
  // Teachers are strictly restricted to assigned batches
  if (user.role === 'teacher') {
    if (!assignedBatchIds.includes(targetBatchId)) {
      throw new AuthorizationError(
        'Access denied: You are not assigned to instruct or grade this batch.',
        'UNASSIGNED_BATCH_ACCESS_DENIED',
        403
      );
    }
    return;
  }

  throw new AuthorizationError('Unauthorized access to class registers.', 'UNAUTHORIZED_CLASS_ACCESS', 403);
}

/**
 * Validates that student fee details can be accessed.
 * Gated by: Owner, Platform Admin, Student viewing self, or Teacher IF principal enabled fee visibility.
 */
export function assertFeeAccess(
  user: UserSessionData | null,
  targetAcademyId: string,
  targetStudentId: string,
  studentLinkedUserId: string | null,
  teacherFeeVisibilityEnabled: boolean
): void {
  if (!user) {
    throw new AuthorizationError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (user.accountStatus !== 'active') {
    throw new AuthorizationError('Account is inactive or suspended.', 'ACCOUNT_SUSPENDED', 403);
  }
  if (user.platformRole === 'platform_admin') {
    return;
  }
  if (user.academyId !== targetAcademyId) {
    throw new AuthorizationError('Cross-academy fee access denied.', 'CROSS_ACADEMY_ACCESS_DENIED', 403);
  }
  // Owner has full fee access
  if (user.role === 'owner') {
    return;
  }
  // Student can view their own fees only
  if (user.role === 'student') {
    if (user.userId !== studentLinkedUserId) {
      throw new AuthorizationError(
        'Access denied: You can only view your own fee records.',
        'STUDENT_FEE_TAMPER_DENIED',
        403
      );
    }
    return;
  }
  // Teacher access is strictly gated by the principal
  if (user.role === 'teacher') {
    if (!teacherFeeVisibilityEnabled) {
      throw new AuthorizationError(
        'Student fee details are restricted by Academy administration policy.',
        'TEACHER_FEE_VISIBILITY_DISABLED',
        403
      );
    }
    return;
  }

  throw new AuthorizationError('Unauthorized fee access.', 'UNAUTHORIZED_FEE_ACCESS', 403);
}

/**
 * Validates access to teacher payment records.
 * STRICTLY Owner & Platform Admin ONLY. Teachers CANNOT access under any circumstance.
 */
export function assertTeacherPaymentAccess(user: UserSessionData | null, targetAcademyId: string): void {
  if (!user) {
    throw new AuthorizationError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (user.accountStatus !== 'active') {
    throw new AuthorizationError('Account is inactive or suspended.', 'ACCOUNT_SUSPENDED', 403);
  }
  if (user.platformRole === 'platform_admin') {
    return;
  }
  if (user.academyId !== targetAcademyId) {
    throw new AuthorizationError('Cross-academy payment access denied.', 'CROSS_ACADEMY_ACCESS_DENIED', 403);
  }
  if (user.role !== 'owner') {
    throw new AuthorizationError(
      'Teacher compensation records are owner-only and strictly confidential.',
      'TEACHER_PAYMENTS_CONFIDENTIAL',
      403
    );
  }
}

/**
 * Validates that student operations (leave request, payment proof submission) affect only the caller's record.
 */
export function assertStudentSelfAccess(
  user: UserSessionData | null,
  targetStudentId: string,
  studentLinkedUserId: string | null
): void {
  if (!user) {
    throw new AuthorizationError('Authentication required.', 'UNAUTHENTICATED', 401);
  }
  if (user.accountStatus !== 'active') {
    throw new AuthorizationError('Account is inactive or suspended.', 'ACCOUNT_SUSPENDED', 403);
  }
  if (user.platformRole === 'platform_admin' || user.role === 'owner') {
    return;
  }
  if (user.role === 'student') {
    if (user.userId !== studentLinkedUserId) {
      throw new AuthorizationError(
        'Access denied: You cannot view or submit records for another student.',
        'CROSS_STUDENT_ACCESS_DENIED',
        403
      );
    }
    return;
  }

  throw new AuthorizationError('Unauthorized student portal action.', 'UNAUTHORIZED_STUDENT_ACTION', 403);
}
