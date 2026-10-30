-- ============================================================
-- TuitionApp — Migration 005: Academy Owner, Teacher & Password Management
--
-- 1. Extends profiles with must_change_password flag
-- 2. Extends academy_memberships with phone and invitation_status
-- 3. Adds security helper functions for suspension and authorization
-- 4. Enforces academy suspension: when an academy is suspended,
--    normal write operations are blocked while data is preserved.
-- 5. Enables owners to manage teachers in their academy with full RLS.
-- ============================================================

-- 1. Extend profiles
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Extend academy_memberships
ALTER TABLE academy_memberships 
    ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE academy_memberships 
    ADD COLUMN IF NOT EXISTS invitation_status TEXT NOT NULL DEFAULT 'active' 
    CHECK (invitation_status IN ('pending', 'active', 'disabled', 'expired'));

-- Index for fast status queries
CREATE INDEX IF NOT EXISTS idx_memberships_status ON academy_memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_invitation_status ON academy_memberships(invitation_status);

-- 3. Helper Functions for Account & Academy State
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

CREATE OR REPLACE FUNCTION is_academy_active(p_academy_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM academies 
        WHERE id = p_academy_id 
          AND status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_user_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id 
          AND account_status = 'active'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION is_academy_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_academy_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_active(UUID) TO authenticated;

-- 4. RLS for Academy Memberships Management by Owner
DROP POLICY IF EXISTS "memberships_manage_admin_owner" ON academy_memberships;
DROP POLICY IF EXISTS "memberships_owner_insert" ON academy_memberships;
DROP POLICY IF EXISTS "memberships_owner_update" ON academy_memberships;
DROP POLICY IF EXISTS "memberships_owner_delete" ON academy_memberships;

-- SELECT: User can view their own memberships; owners view all members in their academy; platform admin views all
CREATE POLICY "memberships_select_authorized" ON academy_memberships
    FOR SELECT USING (
        user_id = auth.uid() 
        OR is_platform_admin() 
        OR is_academy_owner(academy_id)
    );

-- INSERT: Owners and platform admins can invite/add staff
CREATE POLICY "memberships_owner_insert" ON academy_memberships
    FOR INSERT WITH CHECK (
        is_platform_admin() 
        OR (is_academy_owner(academy_id) AND is_academy_active(academy_id))
    );

-- UPDATE: Owners and platform admins can change member status/role
CREATE POLICY "memberships_owner_update" ON academy_memberships
    FOR UPDATE USING (
        is_platform_admin() 
        OR (is_academy_owner(academy_id) AND is_academy_active(academy_id))
    );

-- DELETE: Owners and platform admins can remove members
CREATE POLICY "memberships_owner_delete" ON academy_memberships
    FOR DELETE USING (
        is_platform_admin() 
        OR (is_academy_owner(academy_id) AND is_academy_active(academy_id))
    );

-- 5. RPC Function: Complete Academy Provisioning by Platform Admin
CREATE OR REPLACE FUNCTION provision_academy_with_owner(
    p_name TEXT,
    p_academy_code TEXT,
    p_address TEXT,
    p_phone TEXT,
    p_owner_id UUID,
    p_owner_name TEXT,
    p_owner_email TEXT,
    p_primary_color TEXT DEFAULT '#1565C0',
    p_secondary_color TEXT DEFAULT '#00838F',
    p_welcome_text TEXT DEFAULT NULL,
    p_must_change_password BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_academy_id UUID;
    v_result JSONB;
BEGIN
    -- Authorization check: Caller must be platform admin
    IF NOT is_platform_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only platform administrators can provision new academies.';
    END IF;

    -- Check if academy code is unique
    IF EXISTS (SELECT 1 FROM academies WHERE academy_code = p_academy_code) THEN
        RAISE EXCEPTION 'Academy code % already exists. Please generate a different code.', p_academy_code;
    END IF;

    -- 1. Create Academy
    INSERT INTO academies (
        name, academy_code, owner_id, address, phone,
        primary_color, secondary_color, welcome_text, status
    ) VALUES (
        p_name, p_academy_code, p_owner_id, p_address, p_phone,
        COALESCE(p_primary_color, '#1565C0'), COALESCE(p_secondary_color, '#00838F'),
        COALESCE(p_welcome_text, 'Welcome to ' || p_name), 'active'
    )
    RETURNING id INTO v_academy_id;

    -- 2. Upsert Owner Profile
    INSERT INTO profiles (
        id, role, platform_role, name, email,
        academy_id, account_status, phone_number, must_change_password
    ) VALUES (
        p_owner_id, 'owner', 'member', p_owner_name, p_owner_email,
        v_academy_id, 'active', p_phone, p_must_change_password
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'owner',
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        academy_id = v_academy_id,
        account_status = 'active',
        phone_number = EXCLUDED.phone_number,
        must_change_password = EXCLUDED.must_change_password,
        updated_at = NOW();

    -- 3. Insert Academy Owner Membership
    INSERT INTO academy_memberships (
        academy_id, user_id, role, status, invitation_status, phone
    ) VALUES (
        v_academy_id, p_owner_id, 'owner', 'active', 'active', p_phone
    );

    -- 4. Audit Log
    INSERT INTO audit_logs (actor_id, action, record_id, table_name, details)
    VALUES (
        auth.uid(), 'academy_provisioned', v_academy_id::text, 'academies',
        'Provisioned academy ' || p_name || ' (' || p_academy_code || ') with owner ' || p_owner_email
    );

    v_result := jsonb_build_object(
        'academy_id', v_academy_id,
        'academy_code', p_academy_code,
        'owner_id', p_owner_id,
        'owner_email', p_owner_email
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION provision_academy_with_owner TO authenticated;
