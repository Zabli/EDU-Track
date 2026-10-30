-- ============================================================
-- EduTrack Migration 011: Teacher Workload, Attendance & Payments
-- Enforces:
-- 1. Daily teacher attendance tracking with scheduled vs completed lectures
-- 2. Owner-only teacher compensation ledgers (Strictly confidential)
-- 3. Row Level Security ensuring zero teacher access to payments
-- ============================================================

-- 1. Teacher Attendance & Workload Table
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_date     DATE NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
    lectures_scheduled  INTEGER NOT NULL DEFAULT 0 CHECK (lectures_scheduled >= 0),
    lectures_completed  INTEGER NOT NULL DEFAULT 0 CHECK (lectures_completed >= 0),
    marked_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_att_academy ON teacher_attendance(academy_id);
CREATE INDEX IF NOT EXISTS idx_teacher_att_teacher ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_att_date ON teacher_attendance(attendance_date);

-- 2. Teacher Payments (Compensation) Table
CREATE TABLE IF NOT EXISTS teacher_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_month   TEXT NOT NULL CHECK (billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    method          TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'cheque', 'other')),
    reference       TEXT,
    recorded_by     UUID NOT NULL REFERENCES profiles(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payments_academy ON teacher_payments(academy_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_teacher ON teacher_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_month ON teacher_payments(billing_month);

-- 3. Enable Row-Level Security
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Teacher Attendance
-- Owners & Platform Admin can view and manage all; Teachers can view only their own attendance
DROP POLICY IF EXISTS "teacher_att_select" ON teacher_attendance;
CREATE POLICY "teacher_att_select" ON teacher_attendance
    FOR SELECT USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id) 
        OR teacher_id = auth.uid()
    );

DROP POLICY IF EXISTS "teacher_att_manage_owner" ON teacher_attendance;
CREATE POLICY "teacher_att_manage_owner" ON teacher_attendance
    FOR ALL USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- 5. RLS Policies for Teacher Payments
-- Strictly Owner & Platform Admin ONLY. Teachers CANNOT select or mutate teacher payments!
DROP POLICY IF EXISTS "teacher_payments_select_owner" ON teacher_payments;
CREATE POLICY "teacher_payments_select_owner" ON teacher_payments
    FOR SELECT USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

DROP POLICY IF EXISTS "teacher_payments_manage_owner" ON teacher_payments;
CREATE POLICY "teacher_payments_manage_owner" ON teacher_payments
    FOR ALL USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );
