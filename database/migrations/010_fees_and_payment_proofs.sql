-- ============================================================
-- EduTrack Migration 010: Fees, Invoicing & Payment Proofs
-- Supports pending_verification status, screenshot uploads,
-- and student/owner verification workflows.
-- ============================================================

-- 1. Expand fee_invoices status constraint
ALTER TABLE fee_invoices DROP CONSTRAINT IF EXISTS fee_invoices_status_check;
ALTER TABLE fee_invoices ADD CONSTRAINT fee_invoices_status_check 
    CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'pending_verification'));

-- 2. Add proof_image_url and verification columns to payments table
ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS proof_image_url TEXT,
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3. Student RLS Policy for fee_invoices
DROP POLICY IF EXISTS "fee_invoices_select_student" ON fee_invoices;
CREATE POLICY "fee_invoices_select_student" ON fee_invoices
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE linked_user_id = auth.uid()
        )
    );

-- 4. Owner manage policy for fee_invoices
DROP POLICY IF EXISTS "fee_invoices_manage_owner" ON fee_invoices;
CREATE POLICY "fee_invoices_manage_owner" ON fee_invoices
    FOR ALL USING (
        is_platform_admin() OR
        student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
    );

-- 5. Student RLS Policy for payments (insert pending proof, view own payments)
DROP POLICY IF EXISTS "payments_select_student" ON payments;
CREATE POLICY "payments_select_student" ON payments
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE linked_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "payments_insert_student" ON payments;
CREATE POLICY "payments_insert_student" ON payments
    FOR INSERT WITH CHECK (
        verification_status = 'pending' AND
        student_id IN (
            SELECT id FROM students WHERE linked_user_id = auth.uid()
        )
    );

-- 6. Owner verify/update policy for payments
DROP POLICY IF EXISTS "payments_manage_owner" ON payments;
CREATE POLICY "payments_manage_owner" ON payments
    FOR ALL USING (
        is_platform_admin() OR
        student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
    );
