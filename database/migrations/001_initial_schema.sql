-- ============================================================
-- TuitionApp – Initial Database Schema
-- Migration 001: Tables, indexes, RLS, constraints
-- Time zone context: Asia/Karachi
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('owner', 'teacher', 'parent')),
    name        TEXT NOT NULL,
    academy_id  UUID,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
    phone_number   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_academy_id ON profiles(academy_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 2. academies
-- ============================================================
CREATE TABLE IF NOT EXISTS academies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    owner_id        UUID NOT NULL REFERENCES profiles(id),
    address         TEXT,
    phone           TEXT,
    fee_due_day     SMALLINT NOT NULL DEFAULT 10 CHECK (fee_due_day BETWEEN 1 AND 28),
    reminder_day    SMALLINT NOT NULL DEFAULT 5  CHECK (reminder_day BETWEEN 1 AND 28),
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    timezone        TEXT NOT NULL DEFAULT 'Asia/Karachi',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_academies_owner_id ON academies(owner_id);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_academy
    FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE SET NULL;

-- ============================================================
-- 3. students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id       UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    class_name       TEXT NOT NULL,
    parent_name      TEXT,
    parent_phone     TEXT,
    parent_phone2    TEXT,
    address          TEXT,
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    enrollment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_academy_id ON students(academy_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(name);

-- ============================================================
-- 4. batches
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id  UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    class_name  TEXT NOT NULL,
    schedule    TEXT,
    subject     TEXT,
    teacher_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    teacher_name TEXT,
    student_count INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batches_academy_id ON batches(academy_id);
CREATE INDEX idx_batches_teacher_id ON batches(teacher_id);

-- ============================================================
-- 5. batch_students
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_students (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    joined_at   DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at     DATE,
    UNIQUE (batch_id, student_id, joined_at)
);

CREATE INDEX idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX idx_batch_students_student ON batch_students(student_id);

-- ============================================================
-- 6. parent_students (verified parent-to-student links)
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_students (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (parent_id, student_id)
);

CREATE INDEX idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);

-- ============================================================
-- 7. fee_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    billing_freq    TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_freq IN ('monthly')),
    due_day         SMALLINT NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 28),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_plans_student ON fee_plans(student_id);

-- ============================================================
-- 8. fee_invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    billing_month   TEXT NOT NULL,        -- YYYY-MM format
    amount_due      NUMERIC(12, 2) NOT NULL CHECK (amount_due >= 0),
    amount_paid     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    due_date        DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'unpaid'
                    CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, billing_month)    -- Prevents duplicate monthly invoices
);

CREATE INDEX idx_fee_invoices_student ON fee_invoices(student_id);
CREATE INDEX idx_fee_invoices_status ON fee_invoices(status);
CREATE INDEX idx_fee_invoices_due_date ON fee_invoices(due_date);
CREATE INDEX idx_fee_invoices_billing_month ON fee_invoices(billing_month);

-- ============================================================
-- 9. payments (append-only for normal users)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE RESTRICT,
    student_id          UUID REFERENCES students(id) ON DELETE SET NULL,
    student_name        TEXT,
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    method              TEXT NOT NULL
                        CHECK (method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'other')),
    transaction_ref     TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'verified', 'failed', 'reversed')),
    receipt_number      TEXT UNIQUE,
    recorded_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes               TEXT,
    payment_type        TEXT NOT NULL DEFAULT 'payment'
                        CHECK (payment_type IN ('payment', 'reversal', 'adjustment')),
    idempotency_key     TEXT UNIQUE,      -- Prevents duplicate payment processing
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(verification_status);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- ============================================================
-- 10. attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id         UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    attendance_date  DATE NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    marked_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    corrected_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    correction_reason TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, batch_id, attendance_date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_batch ON attendance(batch_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_batch_date ON attendance(batch_id, attendance_date);

-- ============================================================
-- 11. tests
-- ============================================================
CREATE TABLE IF NOT EXISTS tests (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    batch_name  TEXT,
    subject     TEXT NOT NULL,
    title       TEXT NOT NULL,
    test_date   DATE NOT NULL,
    max_marks   INTEGER NOT NULL CHECK (max_marks > 0),
    created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tests_batch ON tests(batch_id);
CREATE INDEX idx_tests_date ON tests(test_date);

-- ============================================================
-- 12. test_results
-- ============================================================
CREATE TABLE IF NOT EXISTS test_results (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id     UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT,
    marks       INTEGER CHECK (marks >= 0),
    feedback    TEXT,
    rank        INTEGER,
    percentage  NUMERIC(5, 2),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, student_id)
);

CREATE INDEX idx_test_results_test ON test_results(test_id);
CREATE INDEX idx_test_results_student ON test_results(student_id);

-- ============================================================
-- 13. homework
-- ============================================================
CREATE TABLE IF NOT EXISTS homework (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    batch_name      TEXT,
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    due_date        DATE NOT NULL,
    assigned_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_homework_batch ON homework(batch_id);
CREATE INDEX idx_homework_due_date ON homework(due_date);

-- ============================================================
-- 14. homework_submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS homework_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_id     UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name    TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'submitted', 'late', 'missing')),
    notes           TEXT,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (homework_id, student_id)
);

CREATE INDEX idx_hw_submissions_homework ON homework_submissions(homework_id);
CREATE INDEX idx_hw_submissions_student ON homework_submissions(student_id);

-- ============================================================
-- 15. enquiries
-- ============================================================
CREATE TABLE IF NOT EXISTS enquiries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    contact_name    TEXT NOT NULL,
    contact_phone   TEXT NOT NULL,
    source          TEXT,
    referred_by     TEXT,
    status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'enrolled', 'lost')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enquiries_academy ON enquiries(academy_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);

-- ============================================================
-- 16. notification_jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID REFERENCES academies(id) ON DELETE CASCADE,
    recipient_phone TEXT NOT NULL,
    recipient_name  TEXT,
    event_type      TEXT NOT NULL,
    template_name   TEXT,
    template_params JSONB,
    scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ,
    delivery_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    idempotency_key TEXT UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_jobs_status ON notification_jobs(delivery_status);
CREATE INDEX idx_notif_jobs_scheduled ON notification_jobs(scheduled_at);
CREATE INDEX idx_notif_jobs_academy ON notification_jobs(academy_id);

-- ============================================================
-- 17. notification_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID REFERENCES notification_jobs(id) ON DELETE SET NULL,
    provider        TEXT NOT NULL DEFAULT 'whatsapp',
    provider_msg_id TEXT,
    status          TEXT NOT NULL,
    error_message   TEXT,
    sent_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_logs_job ON notification_logs(job_id);

-- ============================================================
-- 18. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    record_id   TEXT,
    table_name  TEXT,
    details     TEXT,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- Triggers: update invoice status when payments change
-- ============================================================
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
    v_amount_due  NUMERIC;
    v_total_paid  NUMERIC;
    v_new_status  TEXT;
    v_due_date    DATE;
BEGIN
    SELECT amount_due, due_date INTO v_amount_due, v_due_date
    FROM fee_invoices WHERE id = NEW.invoice_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE invoice_id = NEW.invoice_id
      AND verification_status = 'verified'
      AND payment_type IN ('payment');

    SELECT v_total_paid - COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE invoice_id = NEW.invoice_id
      AND verification_status = 'verified'
      AND payment_type = 'reversal';

    v_total_paid := GREATEST(v_total_paid, 0);

    IF v_total_paid >= v_amount_due THEN
        v_new_status := 'paid';
    ELSIF v_total_paid > 0 THEN
        IF CURRENT_DATE > v_due_date THEN
            v_new_status := 'overdue';
        ELSE
            v_new_status := 'partial';
        END IF;
    ELSIF CURRENT_DATE > v_due_date THEN
        v_new_status := 'overdue';
    ELSE
        v_new_status := 'unpaid';
    END IF;

    UPDATE fee_invoices
    SET amount_paid = v_total_paid,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_invoice_status
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_status();

-- ============================================================
-- Triggers: update batch student_count
-- ============================================================
CREATE OR REPLACE FUNCTION update_batch_student_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE batches
    SET student_count = (
        SELECT COUNT(*) FROM batch_students
        WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
          AND left_at IS NULL
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_student_count
    AFTER INSERT OR UPDATE OR DELETE ON batch_students
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_student_count();

-- ============================================================
-- updated_at triggers for all relevant tables
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['profiles','academies','students','batches',
                              'fee_invoices','attendance','test_results',
                              'homework_submissions','enquiries']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_set_updated_at_%s
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;
