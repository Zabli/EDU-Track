-- ============================================================
-- EduTrack Migration 009: Tests & Marks System
-- Adds draft/published test status and student-scoped RLS policies.
-- ============================================================

-- 1. Add status column to tests table
ALTER TABLE tests 
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' 
    CHECK (status IN ('draft', 'published'));

CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);

-- 2. Allow students to view published tests for batches they are enrolled in
DROP POLICY IF EXISTS "tests_select_student" ON tests;
CREATE POLICY "tests_select_student" ON tests
    FOR SELECT USING (
        status = 'published' AND
        batch_id IN (
            SELECT batch_id FROM student_batches sb
            JOIN students s ON s.id = sb.student_id
            WHERE s.linked_user_id = auth.uid()
        )
    );

-- 3. Allow students to view their own test results for published tests
DROP POLICY IF EXISTS "test_results_select_student" ON test_results;
CREATE POLICY "test_results_select_student" ON test_results
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE linked_user_id = auth.uid()
        )
        AND test_id IN (
            SELECT id FROM tests WHERE status = 'published'
        )
    );
