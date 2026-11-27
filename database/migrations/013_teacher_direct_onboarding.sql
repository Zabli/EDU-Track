-- ============================================================
-- EduTrack — Migration 013: Direct Teacher Onboarding Fields
-- Adds optional subject specialization and ensures must_change_password
-- exists on profiles for one-time temporary teacher passwords.
-- ============================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subject TEXT;
