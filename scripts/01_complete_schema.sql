-- =============================================================================
-- ZEX-POS MULTI-ORGANIZATION DATABASE SCHEMA
-- =============================================================================
-- This schema includes organization support for multi-tenant POS system
-- Organizations can have multiple restaurants, with proper data isolation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ORGANIZATION TABLES
-- =============================================================================

-- Organizations table (top-level entity)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization settings (configurable per organization)
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- =============================================================================
-- CORE RESTAURANT TABLES (Updated with organization support)
-- =============================================================================

-- Restaurants table (now belongs to organizations)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- =============================================================================
-- USER MANAGEMENT TABLES (Updated with organization support)
-- =============================================================================

-- Staff table (extends auth.users with organization and restaurant-specific data)
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'server' CHECK (role IN ('super_admin', 'org_admin', 'manager', 'server', 'kitchen', 'cashier')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  hourly_rate DECIMAL(10,2),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints to ensure proper hierarchy
  CONSTRAINT staff_hierarchy_check CHECK (
    (role = 'super_admin' AND organization_id IS NULL AND restaurant_id IS NULL) OR
    (role = 'org_admin' AND organization_id IS NOT NULL AND restaurant_id IS NULL) OR
    (role IN ('manager', 'server', 'kitchen', 'cashier') AND organization_id IS NOT NULL AND restaurant_id IS NOT NULL)
  )
);

-- Staff schedules
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, day_of_week)
);

-- =============================================================================
-- RESTAURANT SETUP TABLES (Updated with organization context)
-- =============================================================================

-- Restaurant tables (physical tables in the restaurant)
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  table_name TEXT, -- Optional custom name like "Window Table"
  seats INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  current_order_id UUID, -- Reference to active order
  qr_code_url TEXT, -- For QR code ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- =============================================================================
-- MENU MANAGEMENT TABLES (Updated with organization context)
-- =============================================================================

-- Menu categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

-- Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2), -- For profit calculation
  image_url TEXT,
  prep_time INTEGER DEFAULT 10, -- in minutes
  calories INTEGER,
  allergens TEXT[], -- Array of allergen strings
  dietary_info TEXT[], -- vegetarian, vegan, gluten-free, etc.
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu item variants (size, spice level, etc.)
CREATE TABLE IF NOT EXISTS public.menu_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Small", "Medium", "Large", "Mild", "Spicy"
  price_modifier DECIMAL(10,2) DEFAULT 0, -- Additional cost
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ORDER MANAGEMENT TABLES (Updated with organization context)
-- =============================================================================

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id),
  customer_name TEXT,
  customer_phone TEXT,
  order_number INTEGER NOT NULL, -- Sequential number for the day
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
  order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital_wallet')),
  server_id UUID REFERENCES public.staff(id),
  kitchen_notes TEXT,
  estimated_prep_time INTEGER, -- in minutes
  actual_prep_time INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order item variants (for order customizations)
CREATE TABLE IF NOT EXISTS public.order_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.menu_item_variants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continue with remaining tables...
-- (I'll add the rest of the schema in the next part to avoid exceeding limits)

-- =============================================================================
-- INVENTORY MANAGEMENT TABLES
-- =============================================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  payment_terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL, -- kg, lbs, pieces, etc.
  current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
  maximum_stock DECIMAL(10,3),
  unit_cost DECIMAL(10,2),
  category TEXT,
  storage_location TEXT,
  expiry_tracking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements (for tracking inventory changes)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'usage', 'waste', 'adjustment')),
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_id UUID, -- Could reference orders, purchases, etc.
  notes TEXT,
  staff_id UUID REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CUSTOMER MANAGEMENT TABLES
-- =============================================================================

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birthday DATE,
  preferences JSONB DEFAULT '{}',
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- FINANCIAL MANAGEMENT TABLES
-- =============================================================================

-- Daily sales summary
CREATE TABLE IF NOT EXISTS public.daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_tax DECIMAL(10,2) DEFAULT 0,
  total_tips DECIMAL(10,2) DEFAULT 0,
  cash_sales DECIMAL(10,2) DEFAULT 0,
  card_sales DECIMAL(10,2) DEFAULT 0,
  digital_wallet_sales DECIMAL(10,2) DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, sale_date)
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'tip')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'digital_wallet')),
  payment_reference TEXT, -- External payment ID
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RECEIPT AND PRINTING TABLES
-- =============================================================================

-- Receipt templates
CREATE TABLE IF NOT EXISTS public.receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('order', 'kitchen', 'customer')),
  header_text TEXT,
  footer_text TEXT,
  logo_url TEXT,
  paper_size TEXT DEFAULT 'thermal_80mm',
  font_size INTEGER DEFAULT 12,
  is_default BOOLEAN DEFAULT false,
  template_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated receipts
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  receipt_type TEXT NOT NULL CHECK (receipt_type IN ('customer', 'kitchen', 'merchant')),
  receipt_number TEXT NOT NULL,
  template_id UUID REFERENCES public.receipt_templates(id),
  receipt_data JSONB NOT NULL,
  print_count INTEGER DEFAULT 0,
  last_printed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- HELPER FUNCTIONS FOR ORGANIZATION-AWARE ACCESS
-- =============================================================================

-- Function to get user's organization_id from auth.users metadata
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's restaurant_id from auth.users metadata
CREATE OR REPLACE FUNCTION public.user_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'restaurant_id')::UUID,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from auth.users metadata
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'server'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is org admin for a specific organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_role() = 'org_admin' AND public.user_organization_id() = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES (Organization-aware)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Super admins can view all organizations" ON public.organizations
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Org admins can view their organization" ON public.organizations
  FOR SELECT USING (public.user_organization_id() = id);

CREATE POLICY "Super admins can manage all organizations" ON public.organizations
  FOR ALL USING (public.is_super_admin());

-- Restaurant policies
CREATE POLICY "Super admins can view all restaurants" ON public.restaurants
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Org admins can view restaurants in their organization" ON public.restaurants
  FOR SELECT USING (public.user_organization_id() = organization_id);

CREATE POLICY "Restaurant staff can view their restaurant" ON public.restaurants
  FOR SELECT USING (public.user_restaurant_id() = id);

CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Org admins can manage restaurants in their organization" ON public.restaurants
  FOR ALL USING (public.user_organization_id() = organization_id);

-- Staff policies
CREATE POLICY "Super admins can view all staff" ON public.staff
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Org admins can view staff in their organization" ON public.staff
  FOR SELECT USING (public.user_organization_id() = organization_id);

CREATE POLICY "Restaurant staff can view staff in their restaurant" ON public.staff
  FOR SELECT USING (public.user_restaurant_id() = restaurant_id);

CREATE POLICY "Users can view their own staff record" ON public.staff
  FOR SELECT USING (auth.uid() = id);

-- Menu and order policies (inherit from restaurant access)
CREATE POLICY "Restaurant access controls menu categories" ON public.menu_categories
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Restaurant access controls menu items" ON public.menu_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Restaurant access controls orders" ON public.orders
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Similar policies for all other tables that reference restaurants...

-- Organization settings policies
CREATE POLICY "Super admins can view all organization settings" ON public.organization_settings
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Org admins can view their organization settings" ON public.organization_settings
  FOR SELECT USING (public.user_organization_id() = organization_id);

CREATE POLICY "Super admins can manage all organization settings" ON public.organization_settings
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Org admins can manage their organization settings" ON public.organization_settings
  FOR ALL USING (public.user_organization_id() = organization_id);

-- Staff schedules policies
CREATE POLICY "Staff schedules access control" ON public.staff_schedules
  FOR SELECT USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = restaurant_id) OR
        (auth.uid() = id)
    )
  );

-- Restaurant tables policies
CREATE POLICY "Restaurant tables access control" ON public.restaurant_tables
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

-- Menu item variants policies
CREATE POLICY "Menu item variants access control" ON public.menu_item_variants
  FOR SELECT USING (
    menu_item_id IN (
      SELECT id FROM public.menu_items WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  );

-- Order items policies
CREATE POLICY "Order items access control" ON public.order_items
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

-- Order item variants policies
CREATE POLICY "Order item variants access control" ON public.order_item_variants
  FOR SELECT USING (
    order_item_id IN (
      SELECT id FROM public.order_items WHERE order_id IN (
        SELECT id FROM public.orders WHERE restaurant_id IN (
          SELECT id FROM public.restaurants WHERE
            (public.is_super_admin()) OR
            (public.user_organization_id() = organization_id) OR
            (public.user_restaurant_id() = id)
        )
      )
    )
  );

-- Additional table policies for restaurant-scoped data
CREATE POLICY "Suppliers access control" ON public.suppliers
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Inventory items access control" ON public.inventory_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Stock movements access control" ON public.stock_movements
  FOR SELECT USING (
    inventory_item_id IN (
      SELECT id FROM public.inventory_items WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE
          (public.is_super_admin()) OR
          (public.user_organization_id() = organization_id) OR
          (public.user_restaurant_id() = id)
      )
    )
  );

CREATE POLICY "Customers access control" ON public.customers
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Daily sales access control" ON public.daily_sales
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Payment transactions access control" ON public.payment_transactions
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

CREATE POLICY "Receipt templates access control" ON public.receipt_templates
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE
        (public.is_super_admin()) OR
        (public.user_organization_id() = organization_id) OR
        (public.user_restaurant_id() = id)
    )
  );

CREATE POLICY "Receipts access control" ON public.receipts
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

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_organization_id ON public.restaurants(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_organization_id ON public.staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant_id ON public.staff(restaurant_id);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant_id ON public.restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant_id ON public.inventory_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON public.customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_restaurant_id ON public.daily_sales(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON public.daily_sales(sale_date);

-- =============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables with updated_at columns
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON public.organizations 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at 
    BEFORE UPDATE ON public.organization_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON public.restaurants 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at 
    BEFORE UPDATE ON public.staff 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at 
    BEFORE UPDATE ON public.staff_schedules 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at 
    BEFORE UPDATE ON public.restaurant_tables 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at 
    BEFORE UPDATE ON public.menu_categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON public.menu_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON public.order_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON public.inventory_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_sales_updated_at 
    BEFORE UPDATE ON public.daily_sales 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receipt_templates_updated_at 
    BEFORE UPDATE ON public.receipt_templates 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- INITIAL SUPER ADMIN SETUP
-- =============================================================================

-- Note: This would be handled through the application's admin setup process
-- The first user would be created as a super_admin through a special signup flow
