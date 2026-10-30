-- ============================================================
-- TuitionApp — Multi-Academy, White-Label & Membership Upgrade
-- Migration 003: Platform Roles, Academy Codes, Memberships,
-- Branding, Feature Entitlements & Join Requests
-- ============================================================

-- 1. Extend profiles with platform_role and email
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS platform_role TEXT NOT NULL DEFAULT 'member' 
    CHECK (platform_role IN ('platform_admin', 'member'));

ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_platform_role ON profiles(platform_role);

-- 2. Extend academies with codes, branding, status, and subscription/feature flags
ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS academy_code TEXT UNIQUE;

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'suspended'));

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#1565C0';

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS secondary_color TEXT NOT NULL DEFAULT '#00838F';

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS welcome_text TEXT;

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free' 
    CHECK (subscription_plan IN ('free', 'pro', 'premium'));

ALTER TABLE academies 
    ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{
        "advanced_reports": true,
        "bulk_messaging": true,
        "custom_branding": true,
        "multiple_branches": true
    }'::jsonb;

CREATE INDEX IF NOT EXISTS idx_academies_code ON academies(academy_code);
CREATE INDEX IF NOT EXISTS idx_academies_status ON academies(status);

-- 3. Academy Code Generation Function (Secure, Human-Readable, Collision-Resistant)
-- Format: BTA-XXXXXX (where X is from '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' excluding ambiguous 0,1,O,I)
CREATE OR REPLACE FUNCTION generate_academy_code(prefix TEXT DEFAULT 'BTA')
RETURNS TEXT AS $$
DECLARE
    chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    code_result TEXT;
    done BOOLEAN := FALSE;
    i INT;
    random_part TEXT;
BEGIN
    WHILE NOT done LOOP
        random_part := '';
        FOR i IN 1..6 LOOP
            random_part := random_part || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        code_result := prefix || '-' || random_part;
        
        IF NOT EXISTS (SELECT 1 FROM academies WHERE academy_code = code_result) THEN
            done := TRUE;
        END IF;
    END LOOP;
    RETURN code_result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Populate academy_code for any existing academies missing one
UPDATE academies 
SET academy_code = generate_academy_code('BTA') 
WHERE academy_code IS NULL;

-- Make academy_code NOT NULL now that existing rows are populated
ALTER TABLE academies ALTER COLUMN academy_code SET NOT NULL;

-- 4. Academy Memberships Table
CREATE TABLE IF NOT EXISTS academy_memberships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('owner', 'teacher', 'parent', 'staff')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
    invited_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (academy_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_memberships_academy ON academy_memberships(academy_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON academy_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON academy_memberships(role);

-- Populate academy_memberships from existing profiles & academies
INSERT INTO academy_memberships (academy_id, user_id, role, status)
SELECT p.academy_id, p.id, p.role, p.account_status
FROM profiles p
WHERE p.academy_id IS NOT NULL
ON CONFLICT (academy_id, user_id, role) DO NOTHING;

-- 5. Academy Join Requests Table (for parents requesting to link children via code)
CREATE TABLE IF NOT EXISTS academy_join_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    parent_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_name    TEXT NOT NULL,
    student_class   TEXT NOT NULL,
    student_id      UUID REFERENCES students(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_join_requests_academy ON academy_join_requests(academy_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_parent ON academy_join_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON academy_join_requests(status);

-- 6. Helper Functions for Role Resolution
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND platform_role = 'platform_admin' AND account_status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_has_academy_role(p_academy_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM academy_memberships 
        WHERE academy_id = p_academy_id 
          AND user_id = auth.uid() 
          AND role = p_role 
          AND status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_in_academy(p_academy_id UUID)
RETURNS BOOLEAN AS $$
    SELECT is_platform_admin() OR EXISTS (
        SELECT 1 FROM academy_memberships 
        WHERE academy_id = p_academy_id 
          AND user_id = auth.uid() 
          AND status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 7. Updated RLS Policies for Multi-Academy & Platform Admin

-- Enable RLS on new tables
ALTER TABLE academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_join_requests ENABLE ROW LEVEL SECURITY;

-- Academy Memberships Policies
CREATE POLICY "memberships_select_user" ON academy_memberships
    FOR SELECT USING (
        user_id = auth.uid() 
        OR is_platform_admin() 
        OR user_has_academy_role(academy_id, 'owner')
    );

CREATE POLICY "memberships_manage_admin_owner" ON academy_memberships
    FOR ALL USING (
        is_platform_admin() 
        OR user_has_academy_role(academy_id, 'owner')
    );

-- Academy Join Requests Policies
CREATE POLICY "join_requests_select_parent" ON academy_join_requests
    FOR SELECT USING (
        parent_id = auth.uid() 
        OR is_platform_admin() 
        OR user_has_academy_role(academy_id, 'owner')
        OR user_has_academy_role(academy_id, 'teacher')
    );

CREATE POLICY "join_requests_insert_parent" ON academy_join_requests
    FOR INSERT WITH CHECK (
        parent_id = auth.uid()
    );

CREATE POLICY "join_requests_manage_staff" ON academy_join_requests
    FOR UPDATE USING (
        is_platform_admin() 
        OR user_has_academy_role(academy_id, 'owner')
        OR user_has_academy_role(academy_id, 'teacher')
    );

-- Allow public lookup of basic academy info by academy_code (for join preview only)
CREATE POLICY "academies_lookup_by_code" ON academies
    FOR SELECT USING (
        status = 'active'
    );

-- Platform admin can do EVERYTHING on academies
CREATE POLICY "academies_all_platform_admin" ON academies
    FOR ALL USING (is_platform_admin());

-- Platform admin can view and manage all profiles
CREATE POLICY "profiles_all_platform_admin" ON profiles
    FOR ALL USING (is_platform_admin());

-- Add updated_at trigger for new tables
CREATE TRIGGER trg_set_updated_at_memberships
    BEFORE UPDATE ON academy_memberships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_join_requests
    BEFORE UPDATE ON academy_join_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
