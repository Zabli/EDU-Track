'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess, assertTeacherPaymentAccess, AuthorizationError } from '@/lib/auth/rbac';
import { calculateGrade } from '@/lib/utils/grading';
import { revalidatePath } from 'next/cache';

export type TeacherAttendanceStatus = 'present' | 'absent' | 'late' | 'leave';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'jazzcash' | 'easypaisa' | 'cheque' | 'other';

export interface TeacherAttendanceRecord {
  id?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  attendanceDate: string;
  status: TeacherAttendanceStatus | null;
  lecturesScheduled: number;
  lecturesCompleted: number;
  notes: string | null;
  markedBy?: string | null;
}

export interface TeacherPaymentRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  amount: number;
  paymentDate: string;
  billingMonth: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * Record or update daily teacher attendance and lecture workload counts.
 * Requires Principal or Platform Admin privileges.
 */
export async function recordTeacherDailyAttendance(input: {
  academyId: string;
  teacherId: string;
  attendanceDate: string;
  status: TeacherAttendanceStatus;
  lecturesScheduled: number;
  lecturesCompleted: number;
  notes?: string;
}): Promise<{ success: boolean; message: string }> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    assertAcademyAccess(user, input.academyId);
    if (user.role !== 'owner' && user.platformRole !== 'platform_admin') {
      return { success: false, message: 'Principal authorization required to record faculty attendance.' };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Access denied.' };
  }

  // Input validations
  const validStatuses: TeacherAttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
  if (!validStatuses.includes(input.status)) {
    return { success: false, message: `Invalid attendance status '${input.status}'.` };
  }

  if (input.lecturesScheduled < 0 || input.lecturesCompleted < 0) {
    return { success: false, message: 'Lecture counts cannot be negative.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.attendanceDate)) {
    return { success: false, message: 'Invalid date format (must be YYYY-MM-DD).' };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('teacher_attendance')
    .upsert(
      {
        academy_id: input.academyId,
        teacher_id: input.teacherId,
        attendance_date: input.attendanceDate,
        status: input.status,
        lectures_scheduled: input.lecturesScheduled,
        lectures_completed: input.lecturesCompleted,
        marked_by: user.userId,
        notes: input.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'teacher_id,attendance_date' }
    );

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/owner/teachers/attendance');
  revalidatePath('/owner/teachers');
  revalidatePath('/teacher/workload');
  return { success: true, message: 'Teacher attendance and workload updated successfully.' };
}

/**
 * Fetch daily teacher attendance register for the academy on a given date.
 */
export async function getAcademyTeacherAttendanceRegister(
  academyId: string,
  attendanceDate: string
): Promise<{ success: boolean; date: string; records: TeacherAttendanceRecord[]; message?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, date: attendanceDate, records: [], message: 'Unauthorized.' };
  }

  try {
    assertAcademyAccess(user, academyId);
  } catch (err: any) {
    return { success: false, date: attendanceDate, records: [], message: err.message };
  }

  const supabase = createClient();

  // 1. Fetch active teachers
  const { data: teachers, error: tErr } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('academy_id', academyId)
    .eq('role', 'teacher')
    .eq('account_status', 'active')
    .order('name', { ascending: true });

  if (tErr) {
    return { success: false, date: attendanceDate, records: [], message: tErr.message };
  }

  // 2. Fetch logged attendance for date
  const { data: attList, error: aErr } = await supabase
    .from('teacher_attendance')
    .select('id, teacher_id, attendance_date, status, lectures_scheduled, lectures_completed, notes, marked_by')
    .eq('academy_id', academyId)
    .eq('attendance_date', attendanceDate);

  if (aErr) {
    return { success: false, date: attendanceDate, records: [], message: aErr.message };
  }

  const attMap = new Map((attList || []).map((a) => [a.teacher_id, a]));

  const records: TeacherAttendanceRecord[] = (teachers || []).map((t) => {
    const log = attMap.get(t.id);
    return {
      id: log?.id,
      teacherId: t.id,
      teacherName: t.name,
      teacherEmail: t.email,
      attendanceDate,
      status: (log?.status as TeacherAttendanceStatus) || null,
      lecturesScheduled: log?.lectures_scheduled ?? 0,
      lecturesCompleted: log?.lectures_completed ?? 0,
      notes: log?.notes || null,
      markedBy: log?.marked_by || null,
    };
  });

  return { success: true, date: attendanceDate, records };
}

/**
 * Fetch a teacher's personal workload and lecture completion summary for a month.
 * Scoped to the authenticated teacher (or Principal / Admin).
 */
export async function getTeacherPersonalWorkload(
  teacherId: string,
  billingMonth?: string
): Promise<{
  success: boolean;
  message?: string;
  summary: {
    totalDaysLogged: number;
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    daysLeave: number;
    attendanceRate: number;
    totalScheduledLectures: number;
    totalCompletedLectures: number;
    completionRate: number;
  };
  logs: Array<{
    id: string;
    date: string;
    status: TeacherAttendanceStatus;
    scheduled: number;
    completed: number;
    notes: string | null;
  }>;
}> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return {
      success: false,
      message: 'Unauthorized.',
      summary: { totalDaysLogged: 0, daysPresent: 0, daysAbsent: 0, daysLate: 0, daysLeave: 0, attendanceRate: 0, totalScheduledLectures: 0, totalCompletedLectures: 0, completionRate: 0 },
      logs: [],
    };
  }

  // Teacher self-scoping invariant: Teachers can only view their own workload
  if (user.role === 'teacher' && user.userId !== teacherId) {
    return {
      success: false,
      message: 'Cross-teacher workload access denied.',
      summary: { totalDaysLogged: 0, daysPresent: 0, daysAbsent: 0, daysLate: 0, daysLeave: 0, attendanceRate: 0, totalScheduledLectures: 0, totalCompletedLectures: 0, completionRate: 0 },
      logs: [],
    };
  }

  const supabase = createClient();
  const currentMonth = billingMonth || new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: logs, error } = await supabase
    .from('teacher_attendance')
    .select('id, attendance_date, status, lectures_scheduled, lectures_completed, notes')
    .eq('teacher_id', teacherId)
    .gte('attendance_date', `${currentMonth}-01`)
    .lte('attendance_date', `${currentMonth}-31`)
    .order('attendance_date', { ascending: false });

  if (error) {
    return {
      success: false,
      message: error.message,
      summary: { totalDaysLogged: 0, daysPresent: 0, daysAbsent: 0, daysLate: 0, daysLeave: 0, attendanceRate: 0, totalScheduledLectures: 0, totalCompletedLectures: 0, completionRate: 0 },
      logs: [],
    };
  }

  const items = logs || [];
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;
  let daysLeave = 0;
  let totalScheduled = 0;
  let totalCompleted = 0;

  for (const item of items) {
    if (item.status === 'present') daysPresent++;
    else if (item.status === 'absent') daysAbsent++;
    else if (item.status === 'late') daysLate++;
    else if (item.status === 'leave') daysLeave++;

    totalScheduled += item.lectures_scheduled || 0;
    totalCompleted += item.lectures_completed || 0;
  }

  const totalDays = items.length;
  const attendanceRate = totalDays > 0 ? Math.round(((daysPresent + daysLate) / totalDays) * 100) : 0;
  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  return {
    success: true,
    summary: {
      totalDaysLogged: totalDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysLeave,
      attendanceRate,
      totalScheduledLectures: totalScheduled,
      totalCompletedLectures: totalCompleted,
      completionRate,
    },
    logs: items.map((l) => ({
      id: l.id,
      date: l.attendance_date,
      status: l.status as TeacherAttendanceStatus,
      scheduled: l.lectures_scheduled,
      completed: l.lectures_completed,
      notes: l.notes,
    })),
  };
}

/**
 * Record a teacher compensation / salary payment.
 * STRICTLY OWNER & PLATFORM ADMIN ONLY.
 * Teachers CANNOT record or view payments under any circumstances!
 */
export async function recordTeacherPayment(input: {
  academyId: string;
  teacherId: string;
  amount: number;
  paymentDate: string;
  billingMonth: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string }> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    assertTeacherPaymentAccess(user, input.academyId);
  } catch (err: any) {
    return { success: false, message: err.message || 'Payment recording unauthorized.' };
  }

  if (input.amount <= 0 || isNaN(input.amount)) {
    return { success: false, message: 'Payment amount must be greater than zero.' };
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.billingMonth)) {
    return { success: false, message: 'Invalid billing month format (must be YYYY-MM).' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate)) {
    return { success: false, message: 'Invalid payment date format (must be YYYY-MM-DD).' };
  }

  const validMethods: PaymentMethod[] = ['cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'cheque', 'other'];
  if (!validMethods.includes(input.method)) {
    return { success: false, message: `Invalid payment method '${input.method}'.` };
  }

  const supabase = createClient();

  const { error } = await supabase.from('teacher_payments').insert({
    academy_id: input.academyId,
    teacher_id: input.teacherId,
    amount: input.amount,
    payment_date: input.paymentDate,
    billing_month: input.billingMonth,
    method: input.method,
    reference: input.reference?.trim() || null,
    recorded_by: user.userId,
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/owner/teachers/payments');
  revalidatePath('/owner/teachers');
  revalidatePath('/owner/reports');
  return { success: true, message: 'Teacher payment recorded successfully.' };
}

/**
 * Fetch teacher compensation ledger for Owner / Platform Admin inspection.
 * STRICTLY OWNER & PLATFORM ADMIN ONLY.
 */
export async function getTeacherPaymentsLedger(
  academyId: string,
  filter?: { teacherId?: string; billingMonth?: string }
): Promise<{
  success: boolean;
  message?: string;
  totalPaid: number;
  payments: TeacherPaymentRecord[];
}> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.', totalPaid: 0, payments: [] };
  }

  try {
    assertTeacherPaymentAccess(user, academyId);
  } catch (err: any) {
    return { success: false, message: err.message || 'Access denied.', totalPaid: 0, payments: [] };
  }

  const supabase = createClient();

  let query = supabase
    .from('teacher_payments')
    .select(`
      id,
      teacher_id,
      amount,
      payment_date,
      billing_month,
      method,
      reference,
      notes,
      created_at,
      profiles!teacher_payments_teacher_id_fkey (
        name,
        email
      )
    `)
    .eq('academy_id', academyId)
    .order('payment_date', { ascending: false });

  if (filter?.teacherId) {
    query = query.eq('teacher_id', filter.teacherId);
  }
  if (filter?.billingMonth) {
    query = query.eq('billing_month', filter.billingMonth);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, message: error.message, totalPaid: 0, payments: [] };
  }

  let totalPaid = 0;
  const payments: TeacherPaymentRecord[] = (data || []).map((p: any) => {
    const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    const amt = Number(p.amount) || 0;
    totalPaid += amt;
    return {
      id: p.id,
      teacherId: p.teacher_id,
      teacherName: prof?.name || 'Faculty Member',
      teacherEmail: prof?.email || 'N/A',
      amount: amt,
      paymentDate: p.payment_date,
      billingMonth: p.billing_month,
      method: p.method as PaymentMethod,
      reference: p.reference,
      notes: p.notes,
      createdAt: p.created_at,
    };
  });

  return { success: true, totalPaid, payments };
}

/**
 * Fetch comprehensive academic & operational analytics report for the academy.
 * Accessible to Principal and Platform Admin.
 */
export async function getAcademyReportsData(academyId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    assertAcademyAccess(user, academyId);
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  const supabase = createClient();

  // 1. Batches & Enrolled Students
  const { data: batches } = await supabase
    .from('batches')
    .select('id, name, class_name, subject, student_count, status')
    .eq('academy_id', academyId);

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, status')
    .eq('academy_id', academyId);

  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter((s) => s.status === 'active').length || 0;
  const inactiveStudents = totalStudents - activeStudents;

  // 2. Attendance Rollups
  const { data: attRecords } = await supabase
    .from('attendance')
    .select('status, batch_id')
    .eq('academy_id', academyId);

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  const totalAtt = attRecords?.length || 0;

  for (const a of attRecords || []) {
    if (a.status === 'present') presentCount++;
    else if (a.status === 'absent') absentCount++;
    else if (a.status === 'late') lateCount++;
    else if (a.status === 'leave' || a.status === 'excused') leaveCount++;
  }

  const overallAttendanceRate = totalAtt > 0 ? Math.round(((presentCount + lateCount) / totalAtt) * 100) : 0;

  // 3. Test & Academic Marks
  const { data: testResults } = await supabase
    .from('test_results')
    .select(`
      obtained_marks,
      tests!inner (
        academy_id,
        max_marks,
        status
      )
    `)
    .eq('tests.academy_id', academyId);

  let totalTestEvaluations = 0;
  let totalScorePercentageSum = 0;
  const gradeDistribution: Record<string, number> = {
    'A*': 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };

  for (const tr of testResults || []) {
    const test = Array.isArray(tr.tests) ? tr.tests[0] : tr.tests;
    if (test && test.max_marks > 0 && tr.obtained_marks !== null) {
      totalTestEvaluations++;
      const pct = Math.round((tr.obtained_marks / test.max_marks) * 100);
      totalScorePercentageSum += pct;
      const grade = calculateGrade(pct);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }
  }

  const averageTestScore =
    totalTestEvaluations > 0 ? Math.round(totalScorePercentageSum / totalTestEvaluations) : 0;

  // 4. Financial Summary (Tuition Invoices)
  const { data: invoices } = await supabase
    .from('fee_invoices')
    .select('amount, paid_amount, status')
    .eq('academy_id', academyId);

  let totalInvoiced = 0;
  let totalTuitionCollected = 0;
  let pendingProofCount = 0;
  let paidInvoiceCount = 0;

  for (const inv of invoices || []) {
    const amt = Number(inv.amount) || 0;
    const paid = Number(inv.paid_amount) || 0;
    totalInvoiced += amt;
    totalTuitionCollected += paid;
    if (inv.status === 'pending_verification') pendingProofCount++;
    if (inv.status === 'paid') paidInvoiceCount++;
  }

  const outstandingTuition = Math.max(0, totalInvoiced - totalTuitionCollected);
  const feeCollectionRate =
    totalInvoiced > 0 ? Math.round((totalTuitionCollected / totalInvoiced) * 100) : 0;

  // 5. Teacher Workload & Compensation Summary
  const { data: teacherLogs } = await supabase
    .from('teacher_attendance')
    .select('lectures_scheduled, lectures_completed, status')
    .eq('academy_id', academyId);

  let totalScheduledLectures = 0;
  let totalCompletedLectures = 0;
  for (const tl of teacherLogs || []) {
    totalScheduledLectures += tl.lectures_scheduled || 0;
    totalCompletedLectures += tl.lectures_completed || 0;
  }
  const lectureCompletionRate =
    totalScheduledLectures > 0 ? Math.round((totalCompletedLectures / totalScheduledLectures) * 100) : 0;

  const { data: teacherPayments } = await supabase
    .from('teacher_payments')
    .select('amount')
    .eq('academy_id', academyId);

  const totalTeacherCompensationPaid = (teacherPayments || []).reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return {
    success: true,
    overview: {
      totalBatches: batches?.length || 0,
      totalStudents,
      activeStudents,
      inactiveStudents,
      overallAttendanceRate,
      averageTestScore,
      totalTestEvaluations,
      gradeDistribution,
      totalInvoiced,
      totalTuitionCollected,
      outstandingTuition,
      feeCollectionRate,
      pendingProofCount,
      totalScheduledLectures,
      totalCompletedLectures,
      lectureCompletionRate,
      totalTeacherCompensationPaid,
    },
    batches: (batches || []).map((b) => ({
      id: b.id,
      name: b.name,
      className: b.class_name,
      subject: b.subject,
      studentCount: b.student_count,
      status: b.status,
    })),
  };
}
