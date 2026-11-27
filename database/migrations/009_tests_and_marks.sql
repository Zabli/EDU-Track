-- ============================================================
-- EduTrack Migration 009: Tests & Marks System
-- Adds draft/published test status and student-scoped RLS policies.
-- ============================================================

-- 0. Ensure batch/student linking relation & student user link exist
-- (001_initial_schema.sql named the table batch_students, while app queries & RLS use student_batches)
DO $$
BEGIN
    IF to_regclass('public.student_batches') IS NULL THEN
        IF to_regclass('public.batch_students') IS NOT NULL THEN
            EXECUTE 'CREATE VIEW public.student_batches AS SELECT id, batch_id, student_id, joined_at, left_at FROM public.batch_students';
            EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_batches TO authenticated, service_role';
        ELSE
            EXECUTE '
                CREATE TABLE IF NOT EXISTS public.student_batches (
                    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    batch_id    UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
                    student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
                    joined_at   DATE NOT NULL DEFAULT CURRENT_DATE,
                    left_at     DATE,
                    UNIQUE (batch_id, student_id, joined_at)
                )
            ';
        END IF;
    END IF;
END $$;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

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
