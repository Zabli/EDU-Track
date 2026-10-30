-- ============================================================
-- EduTrack Migration 008: Attendance Statuses & Audit Trail
-- Supports 'present', 'absent', 'late', 'leave', 'excused'
-- and tracks all attendance status modifications in audit log.
-- ============================================================

-- 1. Expand attendance status constraint
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
    CHECK (status IN ('present', 'absent', 'late', 'leave', 'excused'));

-- 2. Allow students to view their own attendance records
DROP POLICY IF EXISTS "attendance_select_student" ON attendance;
CREATE POLICY "attendance_select_student" ON attendance
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE linked_user_id = auth.uid()
        )
    );

-- 3. Attendance Audit Logs Table
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id   UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status      TEXT NOT NULL,
    changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_audit_attendance ON attendance_audit_logs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_student ON attendance_audit_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_batch ON attendance_audit_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_created ON attendance_audit_logs(created_at DESC);

-- Enable RLS on attendance_audit_logs
ALTER TABLE attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs select policy: Academy Owners, Teachers assigned to batch, and Platform Admins
CREATE POLICY "attendance_audit_select" ON attendance_audit_logs
    FOR SELECT USING (
        is_platform_admin() OR
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );

-- Audit logs insert policy: Owners and Teachers
CREATE POLICY "attendance_audit_insert" ON attendance_audit_logs
    FOR INSERT WITH CHECK (
        is_platform_admin() OR
        batch_id IN (SELECT id FROM batches WHERE academy_id = get_my_academy_id())
    );
