-- ============================================================
-- EduTrack FYP Version 2.0 — Teacher Invitations & Onboarding Schema
-- Migration 007: Single-use, time-limited teacher invitation tokens
-- ============================================================

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
CREATE POLICY "invitations_manage_owner" ON teacher_invitations
    FOR ALL USING (
        is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- 2. Anyone with a valid token can view their own invitation metadata
CREATE POLICY "invitations_select_by_token" ON teacher_invitations
    FOR SELECT USING (
        status = 'pending' AND expires_at > NOW()
    );
