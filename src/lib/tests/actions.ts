'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess, assertTeacherClassAccess, assertStudentSelfAccess } from '@/lib/auth/rbac';
import { calculateGrade } from '@/lib/utils/grading';
import { revalidatePath } from 'next/cache';

export interface TestActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Create a new test or examination for a batch.
 */
export async function createTest(formData: FormData): Promise<TestActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const batchId = formData.get('batchId')?.toString();
  const title = formData.get('title')?.toString().trim();
  const subject = formData.get('subject')?.toString().trim();
  const testDate = formData.get('testDate')?.toString().trim();
  const maxMarksStr = formData.get('maxMarks')?.toString().trim();
  const status = (formData.get('status')?.toString().trim() || 'published') as 'draft' | 'published';

  if (!batchId || !title || !subject || !testDate || !maxMarksStr) {
    return { success: false, message: 'Batch, title, subject, test date, and maximum marks are required.' };
  }

  const maxMarks = parseInt(maxMarksStr, 10);
  if (isNaN(maxMarks) || maxMarks <= 0) {
    return { success: false, message: 'Maximum marks must be a positive integer greater than zero.' };
  }

  const supabase = createClient();

  // Verify batch and authorization
  const { data: batch, error: batchErr } = await supabase
    .from('batches')
    .select('id, name, academy_id, teacher_id')
    .eq('id', batchId)
    .single();

  if (batchErr || !batch) {
    return { success: false, message: 'Target batch not found.' };
  }

  const assignedBatchIds = batch.teacher_id === user.userId ? [batch.id] : [];
  try {
    assertTeacherClassAccess(user, batch.academy_id, batch.id, assignedBatchIds);
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized: Access to batch denied.' };
  }

  const { data: newTest, error: insertErr } = await supabase
    .from('tests')
    .insert({
      batch_id: batch.id,
      batch_name: batch.name,
      subject,
      title,
      test_date: testDate,
      max_marks: maxMarks,
      created_by: user.userId,
      status,
    })
    .select('id')
    .single();

  if (insertErr || !newTest) {
    return { success: false, message: insertErr?.message || 'Failed to create test.' };
  }

  revalidatePath('/teacher/tests');
  revalidatePath('/owner/tests');
  return { success: true, message: 'Test created successfully.', data: { id: newTest.id } };
}

/**
 * Toggle test publication status between 'draft' and 'published'.
 */
export async function toggleTestPublication(testId: string): Promise<TestActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required.' };
  }

  const supabase = createClient();

  const { data: test, error } = await supabase
    .from('tests')
    .select('id, batch_id, status, batches(academy_id, teacher_id)')
    .eq('id', testId)
    .single();

  if (error || !test) {
    return { success: false, message: 'Test not found.' };
  }

  const batchInfo = (test as any).batches;
  const assignedBatchIds = batchInfo?.teacher_id === user.userId ? [test.batch_id] : [];
  try {
    assertTeacherClassAccess(user, batchInfo?.academy_id, test.batch_id, assignedBatchIds);
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  const nextStatus = test.status === 'published' ? 'draft' : 'published';

  const { error: updateErr } = await supabase
    .from('tests')
    .update({ status: nextStatus })
    .eq('id', test.id);

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  revalidatePath('/teacher/tests');
  revalidatePath('/student/results');
  return {
    success: true,
    message: `Test status updated to ${nextStatus}. ${nextStatus === 'published' ? 'Results are now visible to students.' : 'Results are hidden from students.'}`,
  };
}

/**
 * Bulk record or update marks for students on a specific test.
 */
export async function saveTestMarks(
  testId: string,
  results: Array<{ studentId: string; studentName: string; marks: number | null; feedback?: string }>
): Promise<TestActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const supabase = createClient();

  const { data: test, error: testErr } = await supabase
    .from('tests')
    .select('id, max_marks, batch_id, batches(academy_id, teacher_id)')
    .eq('id', testId)
    .single();

  if (testErr || !test) {
    return { success: false, message: 'Test not found.' };
  }

  const batchInfo = (test as any).batches;
  const assignedBatchIds = batchInfo?.teacher_id === user.userId ? [test.batch_id] : [];
  try {
    assertTeacherClassAccess(user, batchInfo?.academy_id, test.batch_id, assignedBatchIds);
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized: Access to class denied.' };
  }

  // Validate obtained marks against maximum marks
  for (const item of results) {
    if (item.marks !== null) {
      if (item.marks < 0) {
        return { success: false, message: `Marks for ${item.studentName} cannot be negative (${item.marks}).` };
      }
      if (item.marks > test.max_marks) {
        return {
          success: false,
          message: `Marks for ${item.studentName} (${item.marks}) cannot exceed maximum test marks (${test.max_marks}).`,
        };
      }
    }
  }

  // Prepare upsert payloads with percentage
  const rows = results.map((item) => {
    const percentage =
      item.marks !== null ? Number(((item.marks / test.max_marks) * 100).toFixed(2)) : null;
    return {
      test_id: test.id,
      student_id: item.studentId,
      student_name: item.studentName,
      marks: item.marks,
      percentage,
      feedback: item.feedback?.trim() || null,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: upsertErr } = await supabase
    .from('test_results')
    .upsert(rows, { onConflict: 'test_id,student_id' });

  if (upsertErr) {
    return { success: false, message: upsertErr.message || 'Failed to save test marks.' };
  }

  revalidatePath(`/teacher/tests/${testId}`);
  revalidatePath('/student/results');
  return { success: true, message: `Successfully recorded marks for ${results.length} students.` };
}

/**
 * Fetch a test and its full student roster marking sheet.
 */
export async function getTestMarkingSheet(testId: string) {
  const supabase = createClient();

  const { data: test, error: testErr } = await supabase
    .from('tests')
    .select(`
      id,
      title,
      subject,
      test_date,
      max_marks,
      status,
      batch_id,
      batches (
        id,
        name,
        class_name,
        academy_id,
        teacher_id
      )
    `)
    .eq('id', testId)
    .single();

  if (testErr || !test) {
    return { success: false, message: 'Test not found.', test: null, roster: [] };
  }

  // Fetch enrolled students
  const { data: studentBatches } = await supabase
    .from('student_batches')
    .select(`
      student_id,
      students (
        id,
        full_name,
        roll_no,
        status
      )
    `)
    .eq('batch_id', test.batch_id);

  // Fetch existing test results
  const { data: results } = await supabase
    .from('test_results')
    .select('id, student_id, marks, percentage, feedback, updated_at')
    .eq('test_id', test.id);

  const resultMap = new Map((results || []).map((r) => [r.student_id, r]));

  const roster = (studentBatches || [])
    .map((sb: any) => {
      const s = sb.students;
      if (!s) return null;
      const res = resultMap.get(s.id);
      return {
        studentId: s.id,
        studentName: s.full_name,
        rollNo: s.roll_no,
        status: s.status,
        marks: res?.marks ?? null,
        percentage: res?.percentage ?? null,
        feedback: res?.feedback ?? '',
        grade: calculateGrade(res?.percentage ?? null),
      };
    })
    .filter((item): item is {
      studentId: string;
      studentName: string;
      rollNo: string;
      status: string;
      marks: number | null;
      percentage: number | null;
      feedback: string;
      grade: string;
    } => item !== null);

  return {
    success: true,
    test: {
      id: test.id,
      title: test.title,
      subject: test.subject,
      testDate: test.test_date,
      maxMarks: test.max_marks,
      status: test.status,
      batchName: (test.batches as any)?.name,
      className: (test.batches as any)?.class_name,
    },
    roster,
  };
}

/**
 * Fetch student's published test marks and academic performance summary.
 */
export async function getStudentTestResults(studentId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.', summary: null, results: [] };
  }

  const supabase = createClient();

  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id, full_name, roll_no, linked_user_id')
    .eq('id', studentId)
    .single();

  if (sErr || !student) {
    return { success: false, message: 'Student not found.', summary: null, results: [] };
  }

  try {
    assertStudentSelfAccess(user, student.id, student.linked_user_id);
  } catch (err: any) {
    return { success: false, message: err.message, summary: null, results: [] };
  }

  // Fetch results for published tests only
  const { data: results, error: rErr } = await supabase
    .from('test_results')
    .select(`
      id,
      marks,
      percentage,
      feedback,
      tests (
        id,
        title,
        subject,
        test_date,
        max_marks,
        status,
        batches (
          id,
          name
        )
      )
    `)
    .eq('student_id', studentId);

  if (rErr) {
    return { success: false, message: rErr.message, summary: null, results: [] };
  }

  // Filter only published tests
  const publishedResults = (results || []).filter((r: any) => r.tests?.status === 'published');

  const gradedResults = publishedResults.filter((r: any) => r.marks !== null);
  const total = gradedResults.length;

  let avgPercentage = 0;
  let highestPercentage = 0;
  let lowestPercentage = 100;

  if (total > 0) {
    const percentages = gradedResults.map((r: any) => Number(r.percentage) || 0);
    const sum = percentages.reduce((acc, p) => acc + p, 0);
    avgPercentage = Math.round(sum / total);
    highestPercentage = Math.max(...percentages);
    lowestPercentage = Math.min(...percentages);
  }

  const formatted = publishedResults.map((r: any) => ({
    id: r.id,
    marks: r.marks,
    maxMarks: r.tests?.max_marks,
    percentage: r.percentage,
    grade: calculateGrade(r.percentage),
    feedback: r.feedback,
    title: r.tests?.title,
    subject: r.tests?.subject,
    testDate: r.tests?.test_date,
    batchName: r.tests?.batches?.name,
  }));

  return {
    success: true,
    summary: {
      totalTests: publishedResults.length,
      evaluatedTests: total,
      averagePercentage: avgPercentage,
      highestPercentage,
      lowestPercentage: total > 0 ? lowestPercentage : 0,
      overallGrade: calculateGrade(avgPercentage),
    },
    results: formatted,
  };
}
