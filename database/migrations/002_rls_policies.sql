-- ============================================================
-- TuitionApp – Row Level Security Policies
-- Migration 002
-- ============================================================

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework              ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_academy_id()
RETURNS UUID AS $$
    SELECT academy_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
    SELECT get_my_role() = 'owner';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
    SELECT get_my_role() = 'teacher';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
    SELECT get_my_role() = 'parent';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_owner_or_teacher()
RETURNS BOOLEAN AS $$
    SELECT get_my_role() IN ('owner', 'teacher');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_owner" ON profiles
    FOR SELECT USING (is_owner() AND academy_id = get_my_academy_id());

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- academies
-- ============================================================
CREATE POLICY "academies_select_own" ON academies
    FOR SELECT USING (id = get_my_academy_id());

CREATE POLICY "academies_update_owner" ON academies
    FOR UPDATE USING (owner_id = auth.uid() AND is_owner());

-- ============================================================
-- students
-- ============================================================
CREATE POLICY "students_select_staff" ON students
    FOR SELECT USING (
        academy_id = get_my_academy_id() AND is_owner_or_teacher()
    );

CREATE POLICY "students_select_parent" ON students
    FOR SELECT USING (
        is_parent() AND
        id IN (
            SELECT student_id FROM parent_students
            WHERE parent_id = auth.uid() AND verified = TRUE
        )
    );

CREATE POLICY "students_insert_owner" ON students
    FOR INSERT WITH CHECK (academy_id = get_my_academy_id() AND is_owner());

CREATE POLICY "students_update_owner" ON students
    FOR UPDATE USING (academy_id = get_my_academy_id() AND is_owner());

-- ============================================================
-- batches
-- ============================================================
CREATE POLICY "batches_select_staff" ON batches
    FOR SELECT USING (academy_id = get_my_academy_id() AND is_owner_or_teacher());

CREATE POLICY "batches_select_parent" ON batches
    FOR SELECT USING (
        is_parent() AND
        id IN (
            SELECT bs.batch_id FROM batch_students bs
            JOIN parent_students ps ON ps.student_id = bs.student_id
            WHERE ps.parent_id = auth.uid() AND ps.verified = TRUE AND bs.left_at IS NULL
        )
    );

CREATE POLICY "batches_insert_owner" ON batches
    FOR INSERT WITH CHECK (academy_id = get_my_academy_id() AND is_owner());

CREATE POLICY "batches_update_owner" ON batches
    FOR UPDATE USING (academy_id = get_my_academy_id() AND is_owner());

-- ============================================================
-- batch_students
-- ============================================================
CREATE POLICY "batch_students_select_staff" ON batch_students
    FOR SELECT USING (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "batch_students_manage_owner" ON batch_students
    FOR ALL USING (
        is_owner() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

-- ============================================================
-- parent_students
-- ============================================================
CREATE POLICY "parent_students_select_own" ON parent_students
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "parent_students_manage_owner" ON parent_students
    FOR ALL USING (is_owner() AND
        student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id()));

-- ============================================================
-- fee_invoices
-- ============================================================
CREATE POLICY "fee_invoices_select_staff" ON fee_invoices
    FOR SELECT USING (
        is_owner_or_teacher() AND
        student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "fee_invoices_select_parent" ON fee_invoices
    FOR SELECT USING (
        is_parent() AND
        student_id IN (
            SELECT student_id FROM parent_students
            WHERE parent_id = auth.uid() AND verified = TRUE
        )
    );

CREATE POLICY "fee_invoices_insert_owner" ON fee_invoices
    FOR INSERT WITH CHECK (
        is_owner() AND
        student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
    );

-- ============================================================
-- payments (append-only for normal users)
-- ============================================================
CREATE POLICY "payments_select_staff" ON payments
    FOR SELECT USING (
        is_owner_or_teacher() AND
        invoice_id IN (
            SELECT id FROM fee_invoices
            WHERE student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
        )
    );

CREATE POLICY "payments_select_parent" ON payments
    FOR SELECT USING (
        is_parent() AND
        invoice_id IN (
            SELECT fi.id FROM fee_invoices fi
            JOIN parent_students ps ON ps.student_id = fi.student_id
            WHERE ps.parent_id = auth.uid() AND ps.verified = TRUE
        )
    );

CREATE POLICY "payments_insert_owner" ON payments
    FOR INSERT WITH CHECK (
        is_owner() AND
        payment_type = 'payment' AND
        method = 'cash'
    );

-- ============================================================
-- attendance
-- ============================================================
CREATE POLICY "attendance_select_staff" ON attendance
    FOR SELECT USING (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "attendance_select_parent" ON attendance
    FOR SELECT USING (
        is_parent() AND
        student_id IN (
            SELECT student_id FROM parent_students
            WHERE parent_id = auth.uid() AND verified = TRUE
        )
    );

CREATE POLICY "attendance_insert_staff" ON attendance
    FOR INSERT WITH CHECK (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "attendance_update_staff" ON attendance
    FOR UPDATE USING (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

-- ============================================================
-- tests & test_results
-- ============================================================
CREATE POLICY "tests_select_staff" ON tests
    FOR SELECT USING (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "tests_select_parent" ON tests
    FOR SELECT USING (
        is_parent() AND
        batch_id IN (
            SELECT bs.batch_id FROM batch_students bs
            JOIN parent_students ps ON ps.student_id = bs.student_id
            WHERE ps.parent_id = auth.uid() AND ps.verified = TRUE
        )
    );

CREATE POLICY "tests_insert_staff" ON tests
    FOR INSERT WITH CHECK (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "test_results_select_staff" ON test_results
    FOR SELECT USING (
        is_owner_or_teacher() AND
        test_id IN (
            SELECT id FROM tests
            WHERE batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
        )
    );

CREATE POLICY "test_results_select_parent" ON test_results
    FOR SELECT USING (
        is_parent() AND
        student_id IN (
            SELECT student_id FROM parent_students
            WHERE parent_id = auth.uid() AND verified = TRUE
        )
    );

CREATE POLICY "test_results_upsert_staff" ON test_results
    FOR ALL USING (
        is_owner_or_teacher() AND
        test_id IN (
            SELECT id FROM tests
            WHERE batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
        )
    );

-- ============================================================
-- homework & submissions
-- ============================================================
CREATE POLICY "homework_select_staff" ON homework
    FOR SELECT USING (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "homework_select_parent" ON homework
    FOR SELECT USING (
        is_parent() AND
        batch_id IN (
            SELECT bs.batch_id FROM batch_students bs
            JOIN parent_students ps ON ps.student_id = bs.student_id
            WHERE ps.parent_id = auth.uid() AND ps.verified = TRUE
        )
    );

CREATE POLICY "homework_insert_staff" ON homework
    FOR INSERT WITH CHECK (
        is_owner_or_teacher() AND
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

CREATE POLICY "homework_submissions_select_staff" ON homework_submissions
    FOR SELECT USING (
        is_owner_or_teacher() AND
        homework_id IN (
            SELECT id FROM homework
            WHERE batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
        )
    );

CREATE POLICY "homework_submissions_select_parent" ON homework_submissions
    FOR SELECT USING (
        is_parent() AND
        student_id IN (
            SELECT student_id FROM parent_students
            WHERE parent_id = auth.uid() AND verified = TRUE
        )
    );

CREATE POLICY "homework_submissions_upsert_staff" ON homework_submissions
    FOR ALL USING (
        is_owner_or_teacher()
    );

-- ============================================================
-- enquiries
-- ============================================================
CREATE POLICY "enquiries_select_owner" ON enquiries
    FOR SELECT USING (is_owner() AND academy_id = get_my_academy_id());

CREATE POLICY "enquiries_insert_owner" ON enquiries
    FOR INSERT WITH CHECK (is_owner() AND academy_id = get_my_academy_id());

CREATE POLICY "enquiries_update_owner" ON enquiries
    FOR UPDATE USING (is_owner() AND academy_id = get_my_academy_id());

-- ============================================================
-- notification_jobs & logs
-- ============================================================
CREATE POLICY "notif_jobs_owner" ON notification_jobs
    FOR SELECT USING (is_owner() AND academy_id = get_my_academy_id());

CREATE POLICY "audit_logs_owner" ON audit_logs
    FOR SELECT USING (is_owner());
