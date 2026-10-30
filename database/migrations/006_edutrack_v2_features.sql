-- ============================================================
-- EduTrack FYP Version 2.0 — Web / PWA Core Features Schema
-- Migration 006: Student identity & linking, student removal
-- requests, leave requests, teacher attendance/workload,
-- owner-only teacher payments, and academy registration requests.
-- ============================================================

-- 1. Support 'student' role in profiles and academy_memberships
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('owner', 'teacher', 'student', 'parent', 'staff'));

ALTER TABLE academy_memberships DROP CONSTRAINT IF EXISTS academy_memberships_role_check;
ALTER TABLE academy_memberships ADD CONSTRAINT academy_memberships_role_check 
    CHECK (role IN ('owner', 'teacher', 'student', 'parent', 'staff'));

-- 2. Extend students table with CNIC, student email, verification and linked user account
ALTER TABLE students 
    ADD COLUMN IF NOT EXISTS cnic TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_cnic ON students(cnic);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_linked_user ON students(linked_user_id);

-- 3. Academy Registration Requests (for prospective academy owners)
CREATE TABLE IF NOT EXISTS academy_registration_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_name    TEXT NOT NULL,
    owner_name      TEXT NOT NULL,
    owner_email     TEXT NOT NULL,
    owner_phone     TEXT NOT NULL,
    city            TEXT,
    address         TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'approved', 'rejected', 'correction_requested')),
    admin_notes     TEXT,
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON academy_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_created ON academy_registration_requests(created_at DESC);

-- 4. Student Removal Requests (teachers request, owner decides)
CREATE TABLE IF NOT EXISTS student_removal_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    principal_notes TEXT,
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_removal_req_academy ON student_removal_requests(academy_id);
CREATE INDEX IF NOT EXISTS idx_removal_req_student ON student_removal_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_removal_req_teacher ON student_removal_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_removal_req_status ON student_removal_requests(status);

-- 5. Student Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reason          TEXT NOT NULL,
    proof_image_url TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    principal_notes TEXT,
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_academy ON leave_requests(academy_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- 6. Teacher Attendance and Workload
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_date     DATE NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
    lectures_scheduled  INTEGER NOT NULL DEFAULT 0,
    lectures_completed  INTEGER NOT NULL DEFAULT 0,
    marked_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_att_academy ON teacher_attendance(academy_id);
CREATE INDEX IF NOT EXISTS idx_teacher_att_teacher ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_att_date ON teacher_attendance(attendance_date);

-- 7. Teacher Payment Records (Owner-only by default)
CREATE TABLE IF NOT EXISTS teacher_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_month   TEXT NOT NULL, -- YYYY-MM
    method          TEXT NOT NULL 
                    CHECK (method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'cheque', 'other')),
    reference       TEXT,
    recorded_by     UUID NOT NULL REFERENCES profiles(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payments_academy ON teacher_payments(academy_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_teacher ON teacher_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_month ON teacher_payments(billing_month);

-- 8. Enable Row-Level Security on newly created tables
ALTER TABLE academy_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_removal_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payments              ENABLE ROW LEVEL SECURITY;

-- 9. Helper function: check if caller is student accessing own record
CREATE OR REPLACE FUNCTION is_student_owner_of_record(p_student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM students 
        WHERE id = p_student_id 
          AND (linked_user_id = auth.uid() OR email = (SELECT email FROM profiles WHERE id = auth.uid()))
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION is_student_owner_of_record(UUID) TO authenticated;

-- 10. RLS Policies for New Tables

-- Registration requests:
-- Anyone authenticated can submit; Platform Admin can view and update.
CREATE POLICY "reg_requests_insert_public" ON academy_registration_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "reg_requests_select_admin" ON academy_registration_requests
    FOR SELECT USING (is_platform_admin() OR auth.uid() = reviewed_by);

CREATE POLICY "reg_requests_manage_admin" ON academy_registration_requests
    FOR UPDATE USING (is_platform_admin());

-- Student removal requests:
-- Teachers can insert for their academy; Owners can view & manage; Platform Admin can view.
CREATE POLICY "removal_select" ON student_removal_requests
    FOR SELECT USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id) 
        OR (teacher_id = auth.uid())
    );

CREATE POLICY "removal_insert_teacher" ON student_removal_requests
    FOR INSERT WITH CHECK (
        user_has_academy_role(academy_id, 'teacher') 
        AND teacher_id = auth.uid()
    );

CREATE POLICY "removal_update_owner" ON student_removal_requests
    FOR UPDATE USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- Leave requests:
-- Students can insert for themselves; Students can view their own; Owners/teachers view their academy.
CREATE POLICY "leave_select" ON leave_requests
    FOR SELECT USING (
        is_platform_admin()
        OR is_academy_owner(academy_id)
        OR user_has_academy_role(academy_id, 'teacher')
        OR is_student_owner_of_record(student_id)
    );

CREATE POLICY "leave_insert_student" ON leave_requests
    FOR INSERT WITH CHECK (
        is_student_owner_of_record(student_id)
        OR is_academy_owner(academy_id)
    );

CREATE POLICY "leave_update_owner" ON leave_requests
    FOR UPDATE USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- Teacher Attendance:
-- Owners can view & manage all in their academy; Teachers can view their own attendance.
CREATE POLICY "teacher_att_select" ON teacher_attendance
    FOR SELECT USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id) 
        OR teacher_id = auth.uid()
    );

CREATE POLICY "teacher_att_manage_owner" ON teacher_attendance
    FOR ALL USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- Teacher Payments (Strictly Owner / Platform Admin ONLY. Teachers CANNOT view):
CREATE POLICY "teacher_payments_select_owner" ON teacher_payments
    FOR SELECT USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

CREATE POLICY "teacher_payments_manage_owner" ON teacher_payments
    FOR ALL USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );
