// =============================================================================
// ZEX-POS TYPE DEFINITIONS WITH ORGANIZATION SUPPORT
// =============================================================================

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    role: "super_admin" | "org_admin" | "manager" | "server" | "kitchen" | "cashier";
    organization_id?: string;
    restaurant_id?: string;
  };
}

export type UserType = {
  id: string;
  email?: string;
  full_name: string;
  role: "super_admin" | "org_admin" | "manager" | "server" | "kitchen" | "cashier";
  organization_id?: string | null;
  restaurant_id?: string | null;
  phone?: string;
  is_active?: boolean;
  permissions?: string[];
  hire_date?: string;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
};

// =============================================================================
// ORGANIZATION TYPES
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  billing_address?: string;
  subscription_plan: "basic" | "premium" | "enterprise";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// RESTAURANT TYPES (Updated with organization support)
// =============================================================================

export interface Restaurant {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  timezone?: string;
  currency?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// STAFF TYPES (Updated with organization support)
// =============================================================================

export interface Staff {
  id: string;
  organization_id?: string;
  restaurant_id?: string;
  full_name?: string;
  role: "super_admin" | "org_admin" | "manager" | "server" | "kitchen" | "cashier";
  phone?: string;
  is_active: boolean;
  hire_date: string;
  hourly_rate?: number;
  permissions: string[];
  created_at: string;
  updated_at: string;
  // Email is fetched from auth.users via the id foreign key
  email?: string;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_of_week: number; // 0-6 (Sunday to Saturday)
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffAnalytics {
  id: string;
  staff_id: string;
  date: string;
  orders_served: number;
  revenue_generated: number;
  hours_worked: number;
  average_service_time: number;
  customer_rating: number;
  created_at: string;
}

// =============================================================================
// TABLE TYPES
// =============================================================================

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  table_name?: string;
  seats: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  current_order_id?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// MENU TYPES
// =============================================================================

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  image_url?: string;
  prep_time: number;
  calories?: number;
  allergens: string[];
  dietary_info: string[];
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  menu_categories?: {
    name: string;
    id: string;
  };
}

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
  created_at: string;
}

export interface MenuAnalytics {
  id: string;
  menu_item_id: string;
  date: string;
  orders_count: number;
  revenue: number;
  cost: number;
  profit: number;
  created_at: string;
}

// =============================================================================
// ORDER TYPES
// =============================================================================

export interface Order {
  id: string;
  restaurant_id: string;
  table_id?: string;
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  order_number: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  order_type: "dine_in" | "takeaway" | "delivery";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: "pending" | "paid" | "refunded";
  payment_method?: "cash" | "card" | "digital_wallet";
  server_id?: string;
  kitchen_notes?: string;
  estimated_prep_time?: number;
  actual_prep_time?: number;
  created_at: string;
  updated_at: string;

  // Relationships
  restaurant_tables?: RestaurantTable;
  staff?: Staff;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  status: "pending" | "preparing" | "ready" | "served";
  created_at: string;
  updated_at: string;

  // Relationships
  menu_items?: MenuItem;
  order_item_variants?: OrderItemVariant[];
}

export interface OrderItemVariant {
  id: string;
  order_item_id: string;
  variant_id: string;
  created_at: string;

  // Relationships
  menu_item_variants?: MenuItemVariant;
}

// =============================================================================
// INVENTORY TYPES
// =============================================================================

export interface InventoryCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit_cost: number;
  supplier_info?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  inventory_categories?: InventoryCategory;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  movement_type: "in" | "out" | "adjustment" | "waste";
  quantity: number;
  reference_id?: string;
  reference_type?: "order" | "purchase" | "adjustment" | "waste";
  notes?: string;
  staff_id?: string;
  created_at: string;

  // Relationships
  inventory_items?: InventoryItem;
  staff?: Staff;
}

// =============================================================================
// FINANCIAL TYPES
// =============================================================================

export interface DailySales {
  id: string;
  restaurant_id: string;
  date: string;
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  average_order_value: number;
  cash_sales: number;
  card_sales: number;
  digital_wallet_sales: number;
  refunds: number;
  discounts: number;
  taxes: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CUSTOMER TYPES
// =============================================================================

export interface Customer {
  id: string;
  restaurant_id: string;
  name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  last_visit?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  cost_price?: number;
  category_id: string;
  prep_time: number;
  calories?: number;
  allergens: string[];
  dietary_info: string[];
  is_available: boolean;
  is_featured: boolean;
  image_url?: string;
}

export interface OrderFormData {
  table_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: "dine_in" | "takeaway" | "delivery";
  items: {
    menu_item_id: string;
    quantity: number;
    variants?: string[];
    special_instructions?: string;
  }[];
  kitchen_notes?: string;
}

export interface StaffFormData {
  full_name: string;
  email: string;
  phone?: string;
  role: "manager" | "server" | "kitchen" | "cashier";
  hourly_rate?: number;
  permissions: string[];
  is_active: boolean;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface SalesAnalytics {
  daily_revenue: { date: string; revenue: number; orders: number }[];
  popular_items: { item_name: string; orders: number; revenue: number }[];
  hourly_distribution: { hour: number; orders: number }[];
  payment_methods: { method: string; amount: number; percentage: number }[];
}

export interface PerformanceMetrics {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  customer_count: number;
  growth_percentage: number;
}

// =============================================================================
// RECEIPT TYPES
// =============================================================================

export interface Receipt {
  id: string;
  order_id: string;
  restaurant_id: string;
  receipt_number: string;
  generated_at: string;
  generated_by: string;
  receipt_type: "payment" | "refund" | "void";
  receipt_data: ReceiptData;
  created_at: string;
}

export interface ReceiptData {
  restaurant: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    logo_url?: string;
  };
  order: {
    order_number: number;
    table_number?: string;
    table_name?: string;
    server_name?: string;
    order_type: "dine_in" | "takeaway" | "delivery";
    created_at: string;
    completed_at: string;
  };
  customer?: {
    name?: string;
    phone?: string;
  };
  items: ReceiptItem[];
  summary: {
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    service_charge?: number;
    total_amount: number;
  };
  payment: {
    method: "cash" | "card" | "digital_wallet";
    amount_tendered?: number;
    change_amount?: number;
    payment_reference?: string;
  };
  footer?: {
    thank_you_message?: string;
    return_policy?: string;
    website?: string;
    social_media?: string;
  };
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  variants?: string[];
}

export interface ReceiptTemplate {
  id: string;
  restaurant_id: string;
  name: string;
  template_type: "thermal" | "a4" | "custom";
  width: number; // in mm
  font_size: number;
  header_config: ReceiptHeaderConfig;
  footer_config: ReceiptFooterConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReceiptHeaderConfig {
  show_logo: boolean;
  show_restaurant_name: boolean;
  show_address: boolean;
  show_contact: boolean;
  custom_header?: string;
}

export interface ReceiptFooterConfig {
  show_thank_you: boolean;
  thank_you_message: string;
  show_return_policy: boolean;
  return_policy_text: string;
  show_website: boolean;
  show_social: boolean;
  custom_footer?: string;
}
