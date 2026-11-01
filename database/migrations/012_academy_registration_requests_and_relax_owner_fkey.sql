-- ============================================================
-- EduTrack — Migration 012: Academy Registration Requests & FK Resilience
-- ============================================================

-- 1. Create academy_registration_requests table if not exists
CREATE TABLE IF NOT EXISTS public.academy_registration_requests (
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
    reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON public.academy_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_created ON public.academy_registration_requests(created_at DESC);

ALTER TABLE public.academy_registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reg_requests_insert_public" ON public.academy_registration_requests;
CREATE POLICY "reg_requests_insert_public" ON public.academy_registration_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reg_requests_select_admin" ON public.academy_registration_requests;
CREATE POLICY "reg_requests_select_admin" ON public.academy_registration_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.platform_role = 'platform_admin'
        )
        OR auth.uid() = reviewed_by
    );

DROP POLICY IF EXISTS "reg_requests_manage_admin" ON public.academy_registration_requests;
CREATE POLICY "reg_requests_manage_admin" ON public.academy_registration_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.platform_role = 'platform_admin'
        )
    );

GRANT ALL ON public.academy_registration_requests TO anon, authenticated, service_role;

-- 2. Relax owner_id NOT NULL on academies to permit provisional records
ALTER TABLE public.academies ALTER COLUMN owner_id DROP NOT NULL;
