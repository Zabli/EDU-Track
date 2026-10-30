-- ============================================================
-- TuitionApp — Migration 004: Fix RLS Recursion on students & parent_students
--
-- Root Cause:
-- 1. "students_select_parent" on students queried parent_students.
-- 2. "parent_students_manage_owner" on parent_students was FOR ALL,
--    so it intercepted SELECT and queried students in a subquery:
--    student_id IN (SELECT id FROM students WHERE academy_id = get_my_academy_id())
-- 3. That subquery triggered RLS on students again -> infinite recursion!
--
-- Solution:
-- 1. Create narrow, safe SECURITY DEFINER helper functions with fixed search_path = public:
--    - get_parent_verified_student_ids(parent_id) -> returns verified child IDs without triggering RLS
--    - get_academy_student_ids_for_user(academy_id) -> validates caller authorization and returns student IDs without triggering RLS
-- 2. Break parent_students policies into distinct SELECT, INSERT, UPDATE, DELETE policies.
-- 3. Add explicit platform admin SELECT and MANAGE policies on students.
-- 4. Preserve strict multi-tenant isolation: owners/teachers can only access their academy;
--    parents can only access verified linked children.
-- ============================================================

-- Step 1: Create safe, non-recursive SECURITY DEFINER helper functions
CREATE OR REPLACE FUNCTION get_parent_verified_student_ids(p_parent_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT student_id 
    FROM parent_students 
    WHERE parent_id = p_parent_id 
      AND verified = TRUE;
$$;

CREATE OR REPLACE FUNCTION get_academy_student_ids_for_user(p_academy_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT id 
    FROM students 
    WHERE academy_id = p_academy_id
      AND (
          is_platform_admin() 
          OR user_has_academy_role(p_academy_id, 'owner')
          OR user_has_academy_role(p_academy_id, 'teacher')
          OR (academy_id = get_my_academy_id() AND is_owner_or_teacher())
      );
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_parent_verified_student_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_academy_student_ids_for_user(UUID) TO authenticated;

-- ============================================================
-- Step 2: Fix policies on 'students'
-- ============================================================
DROP POLICY IF EXISTS "students_select_staff" ON students;
DROP POLICY IF EXISTS "students_select_parent" ON students;
DROP POLICY IF EXISTS "students_select_platform_admin" ON students;
DROP POLICY IF EXISTS "students_insert_owner" ON students;
DROP POLICY IF EXISTS "students_update_owner" ON students;
DROP POLICY IF EXISTS "students_delete_owner" ON students;

-- Staff SELECT: Authorized academy owners and teachers can view their academy's students
CREATE POLICY "students_select_staff" ON students
    FOR SELECT USING (
        (academy_id = get_my_academy_id() AND is_owner_or_teacher())
        OR user_has_academy_role(academy_id, 'owner')
        OR user_has_academy_role(academy_id, 'teacher')
    );

-- Parent SELECT: Parents view only their verified linked children (using non-recursive helper)
CREATE POLICY "students_select_parent" ON students
    FOR SELECT USING (
        is_parent() AND id IN (SELECT get_parent_verified_student_ids(auth.uid()))
    );

-- Platform Admin SELECT: Super admins can view students when inspecting academies
CREATE POLICY "students_select_platform_admin" ON students
    FOR SELECT USING (
        is_platform_admin()
    );

-- Staff INSERT: Owners (and platform admins) can add students to their academy
CREATE POLICY "students_insert_owner" ON students
    FOR INSERT WITH CHECK (
        (academy_id = get_my_academy_id() AND is_owner())
        OR user_has_academy_role(academy_id, 'owner')
        OR is_platform_admin()
    );

-- Staff UPDATE: Owners (and platform admins) can update students in their academy
CREATE POLICY "students_update_owner" ON students
    FOR UPDATE USING (
        (academy_id = get_my_academy_id() AND is_owner())
        OR user_has_academy_role(academy_id, 'owner')
        OR is_platform_admin()
    );

-- Staff DELETE: Owners (and platform admins) can delete/archive students in their academy
CREATE POLICY "students_delete_owner" ON students
    FOR DELETE USING (
        (academy_id = get_my_academy_id() AND is_owner())
        OR user_has_academy_role(academy_id, 'owner')
        OR is_platform_admin()
    );

-- ============================================================
-- Step 3: Fix policies on 'parent_students'
-- ============================================================
DROP POLICY IF EXISTS "parent_students_select_own" ON parent_students;
DROP POLICY IF EXISTS "parent_students_manage_owner" ON parent_students;
DROP POLICY IF EXISTS "parent_students_select_parent" ON parent_students;
DROP POLICY IF EXISTS "parent_students_select_staff" ON parent_students;
DROP POLICY IF EXISTS "parent_students_insert_owner" ON parent_students;
DROP POLICY IF EXISTS "parent_students_update_owner" ON parent_students;
DROP POLICY IF EXISTS "parent_students_delete_owner" ON parent_students;

-- Parent SELECT: Parents can view their own child links
CREATE POLICY "parent_students_select_parent" ON parent_students
    FOR SELECT USING (
        parent_id = auth.uid()
    );

-- Staff SELECT: Staff and platform admins can view links for students in their academy
CREATE POLICY "parent_students_select_staff" ON parent_students
    FOR SELECT USING (
        is_platform_admin()
        OR student_id IN (SELECT get_academy_student_ids_for_user(get_my_academy_id()))
    );

-- Staff INSERT: Staff can link parents to students in their academy
CREATE POLICY "parent_students_insert_owner" ON parent_students
    FOR INSERT WITH CHECK (
        is_platform_admin()
        OR student_id IN (SELECT get_academy_student_ids_for_user(get_my_academy_id()))
    );

-- Staff UPDATE: Staff can verify or update links for students in their academy
CREATE POLICY "parent_students_update_owner" ON parent_students
    FOR UPDATE USING (
        is_platform_admin()
        OR student_id IN (SELECT get_academy_student_ids_for_user(get_my_academy_id()))
    );

-- Staff DELETE: Staff can unlink parents from students in their academy
CREATE POLICY "parent_students_delete_owner" ON parent_students
    FOR DELETE USING (
        is_platform_admin()
        OR student_id IN (SELECT get_academy_student_ids_for_user(get_my_academy_id()))
    );

-- ============================================================
-- Step 4: Fix fee_invoices & payments to also prevent any indirect recursion
-- ============================================================
DROP POLICY IF EXISTS "fee_invoices_select_staff" ON fee_invoices;
DROP POLICY IF EXISTS "fee_invoices_select_parent" ON fee_invoices;
DROP POLICY IF EXISTS "fee_invoices_insert_owner" ON fee_invoices;

CREATE POLICY "fee_invoices_select_staff" ON fee_invoices
    FOR SELECT USING (
        is_platform_admin()
        OR (
            is_owner_or_teacher() AND
            student_id IN (SELECT get_academy_student_ids_for_user(get_my_academy_id()))
        )
    );

CREATE POLICY "fee_invoices_select_parent" ON fee_invoices
    FOR SELECT USING (
        is_parent() AND
        student_id IN (SELECT get_parent_verified_student_ids(auth.uid()))
    );

CREATE POLICY "fee_invoices_insert_owner" ON fee_invoices
    FOR INSERT WITH CHECK (
        is_platform_admin()
        OR (
            is_owner() AND
            student_id IN (SELECT get_academy_student_ids_for_user(get_my_academy_id()))
        )
    );
