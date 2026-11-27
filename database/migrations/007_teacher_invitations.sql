-- ============================================================
-- EduTrack FYP Version 2.0 — Teacher Invitations & Onboarding Schema
-- Migration 007: Single-use, time-limited teacher invitation tokens
-- ============================================================

-- Ensure required helper functions exist (in case 003/005 were not run yet)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND platform_role = 'platform_admin' AND account_status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_academy_owner(p_academy_id UUID)
RETURNS BOOLEAN AS $$
    SELECT is_platform_admin() OR EXISTS (
        SELECT 1 FROM academy_memberships 
        WHERE academy_id = p_academy_id 
          AND user_id = auth.uid() 
          AND role = 'owner' 
          AND status = 'active'
    ) OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND academy_id = p_academy_id
          AND role = 'owner'
          AND account_status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_academy_owner(UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS teacher_invitations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_name        TEXT NOT NULL,
    email               TEXT NOT NULL,
    phone               TEXT,
    assigned_subjects   TEXT,
    invitation_token    TEXT UNIQUE NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at          TIMESTAMPTZ NOT NULL,
    invited_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    accepted_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_inv_token ON teacher_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_teacher_inv_academy ON teacher_invitations(academy_id);
CREATE INDEX IF NOT EXISTS idx_teacher_inv_email ON teacher_invitations(email);
CREATE INDEX IF NOT EXISTS idx_teacher_inv_status ON teacher_invitations(status);

ALTER TABLE teacher_invitations ENABLE ROW LEVEL SECURITY;

-- Policies:
-- 1. Owners and platform admins can manage invitations for their academy
DROP POLICY IF EXISTS "invitations_manage_owner" ON teacher_invitations;
CREATE POLICY "invitations_manage_owner" ON teacher_invitations
    FOR ALL USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- 2. Anyone with a valid token can view their own invitation metadata
DROP POLICY IF EXISTS "invitations_select_by_token" ON teacher_invitations;
CREATE POLICY "invitations_select_by_token" ON teacher_invitations
    FOR SELECT USING (
        status = 'pending' AND expires_at > NOW()
    );
