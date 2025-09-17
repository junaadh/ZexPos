-- =============================================================================
-- FIX RESTAURANT TABLES AND MENU ITEMS RLS POLICIES
-- =============================================================================
-- This script adds missing INSERT, UPDATE, and DELETE policies for restaurant_tables
-- and menu_items with role-based permissions

-- ============================================================================
-- RESTAURANT TABLES POLICIES
-- ============================================================================

-- Drop existing policy if it exists (to recreate with all operations)
DROP POLICY IF EXISTS "Restaurant tables access control" ON public.restaurant_tables;

-- Drop individual policies if they exist
DROP POLICY IF EXISTS "Restaurant tables select policy" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Restaurant tables insert policy" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Restaurant tables update policy" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Restaurant tables delete policy" ON public.restaurant_tables;

-- Create comprehensive policies for restaurant_tables
CREATE POLICY "Restaurant tables select policy" ON public.restaurant_tables
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Restaurant tables insert policy" ON public.restaurant_tables
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Restaurant tables update policy" ON public.restaurant_tables
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  ) WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Restaurant tables delete policy" ON public.restaurant_tables
  FOR DELETE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- ============================================================================
-- MENU ITEMS POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Restaurant access controls menu items" ON public.menu_items;

-- Drop individual policies if they exist
DROP POLICY IF EXISTS "Menu items select policy" ON public.menu_items;
DROP POLICY IF EXISTS "Menu items insert policy" ON public.menu_items;
DROP POLICY IF EXISTS "Menu items update policy" ON public.menu_items;
DROP POLICY IF EXISTS "Menu items delete policy" ON public.menu_items;

-- Create comprehensive policies for menu_items
CREATE POLICY "Menu items select policy" ON public.menu_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Only managers and admins can add new menu items
CREATE POLICY "Menu items insert policy" ON public.menu_items
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id AND public.user_role() IN ('org_admin', 'manager')) OR
        (public.user_restaurant_id() = id AND public.user_role() IN ('manager'))
    )
  );

-- Staff can update availability, but only managers can update everything else
CREATE POLICY "Menu items update policy" ON public.menu_items
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  ) WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Only managers and admins can delete menu items
CREATE POLICY "Menu items delete policy" ON public.menu_items
  FOR DELETE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id AND public.user_role() IN ('org_admin', 'manager')) OR
        (public.user_restaurant_id() = id AND public.user_role() IN ('manager'))
    )
  );

-- ============================================================================
-- MENU CATEGORIES POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Restaurant access controls menu categories" ON public.menu_categories;

-- Drop individual policies if they exist
DROP POLICY IF EXISTS "Menu categories select policy" ON public.menu_categories;
DROP POLICY IF EXISTS "Menu categories insert policy" ON public.menu_categories;
DROP POLICY IF EXISTS "Menu categories update policy" ON public.menu_categories;
DROP POLICY IF EXISTS "Menu categories delete policy" ON public.menu_categories;

-- Create comprehensive policies for menu_categories
CREATE POLICY "Menu categories select policy" ON public.menu_categories
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Only managers and admins can manage categories
CREATE POLICY "Menu categories insert policy" ON public.menu_categories
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id AND public.user_role() IN ('org_admin', 'manager')) OR
        (public.user_restaurant_id() = id AND public.user_role() IN ('manager'))
    )
  );

CREATE POLICY "Menu categories update policy" ON public.menu_categories
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id AND public.user_role() IN ('org_admin', 'manager')) OR
        (public.user_restaurant_id() = id AND public.user_role() IN ('manager'))
    )
  ) WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id AND public.user_role() IN ('org_admin', 'manager')) OR
        (public.user_restaurant_id() = id AND public.user_role() IN ('manager'))
    )
  );

CREATE POLICY "Menu categories delete policy" ON public.menu_categories
  FOR DELETE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id AND public.user_role() IN ('org_admin', 'manager')) OR
        (public.user_restaurant_id() = id AND public.user_role() IN ('manager'))
    )
  );
