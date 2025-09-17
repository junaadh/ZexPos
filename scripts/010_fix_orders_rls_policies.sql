-- =============================================================================
-- FIX ORDERS RLS POLICIES
-- =============================================================================
-- This script adds missing RLS policies for INSERT, UPDATE, and DELETE operations on orders

-- Add INSERT policy for orders
CREATE POLICY "Restaurant staff can insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Add UPDATE policy for orders
CREATE POLICY "Restaurant staff can update orders" ON public.orders
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

-- Add DELETE policy for orders
CREATE POLICY "Restaurant staff can delete orders" ON public.orders
  FOR DELETE USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Add SELECT policy for order_items (if not exists)
CREATE POLICY "Order items select access control" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  );

-- Add INSERT policy for order_items to ensure they can be created
CREATE POLICY "Restaurant staff can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  );

-- Add UPDATE policy for order_items
CREATE POLICY "Restaurant staff can update order items" ON public.order_items
  FOR UPDATE USING (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  ) WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  );

-- Add DELETE policy for order_items
CREATE POLICY "Restaurant staff can delete order items" ON public.order_items
  FOR DELETE USING (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  );
