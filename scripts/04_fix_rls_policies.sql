-- =============================================================================
-- FIX RLS POLICIES FOR STAFF MANAGEMENT
-- =============================================================================
-- This script adds missing INSERT, UPDATE, DELETE policies for staff table
-- to allow super admins and org admins to manage staff members

-- Add INSERT policies for staff table
CREATE POLICY "Super admins can insert staff" ON public.staff
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "Org admins can insert staff in their organization" ON public.staff
  FOR INSERT WITH CHECK (
    public.user_organization_id() = organization_id AND
    -- Ensure org admins can only create non-admin roles
    role IN ('manager', 'server', 'kitchen', 'cashier')
  );

-- Add UPDATE policies for staff table
CREATE POLICY "Super admins can update all staff" ON public.staff
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Org admins can update staff in their organization" ON public.staff
  FOR UPDATE USING (
    public.user_organization_id() = organization_id AND
    -- Prevent org admins from changing super_admin or org_admin roles
    role IN ('manager', 'server', 'kitchen', 'cashier')
  )
  WITH CHECK (
    public.user_organization_id() = organization_id AND
    role IN ('manager', 'server', 'kitchen', 'cashier')
  );

CREATE POLICY "Users can update their own staff record" ON public.staff
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.staff WHERE id = auth.uid()));

-- Add DELETE policies for staff table
CREATE POLICY "Super admins can delete all staff" ON public.staff
  FOR DELETE USING (public.is_super_admin());

CREATE POLICY "Org admins can delete staff in their organization" ON public.staff
  FOR DELETE USING (
    public.user_organization_id() = organization_id AND
    -- Prevent org admins from deleting super_admin or org_admin roles
    role IN ('manager', 'server', 'kitchen', 'cashier')
  );

-- =============================================================================
-- FIX RLS POLICIES FOR ORGANIZATION MANAGEMENT
-- =============================================================================

-- Add missing INSERT, UPDATE, DELETE policies for organizations
CREATE POLICY "Super admins can insert organizations" ON public.organizations
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update all organizations" ON public.organizations
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Org admins can update their organization" ON public.organizations
  FOR UPDATE USING (public.user_organization_id() = id)
  WITH CHECK (public.user_organization_id() = id);

CREATE POLICY "Super admins can delete organizations" ON public.organizations
  FOR DELETE USING (public.is_super_admin());

-- =============================================================================
-- FIX RLS POLICIES FOR RESTAURANT MANAGEMENT  
-- =============================================================================

-- Add missing INSERT, UPDATE, DELETE policies for restaurants
CREATE POLICY "Super admins can insert restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "Org admins can insert restaurants in their organization" ON public.restaurants
  FOR INSERT WITH CHECK (public.user_organization_id() = organization_id);

CREATE POLICY "Super admins can update all restaurants" ON public.restaurants
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Org admins can update restaurants in their organization" ON public.restaurants
  FOR UPDATE USING (public.user_organization_id() = organization_id)
  WITH CHECK (public.user_organization_id() = organization_id);

CREATE POLICY "Super admins can delete restaurants" ON public.restaurants
  FOR DELETE USING (public.is_super_admin());

CREATE POLICY "Org admins can delete restaurants in their organization" ON public.restaurants
  FOR DELETE USING (public.user_organization_id() = organization_id);
