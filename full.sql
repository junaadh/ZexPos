
\restrict l3xeb776ac5dZyV3Mu6SBHpctFdbQUYwo2erVOcas9B0QXdFBkd6agDqMYF4Ivj


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the next order number for this restaurant for today
    SELECT COALESCE(MAX(order_number), 0) + 1 
    INTO next_number
    FROM public.orders 
    WHERE restaurant_id = NEW.restaurant_id 
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Set the order number
    NEW.order_number := next_number;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.user_role() = 'org_admin' AND public.user_organization_id() = org_id;
END;
$$;


ALTER FUNCTION "public"."is_org_admin"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.user_role() = 'super_admin';
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_organization_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID,
    NULL
  );
END;
$$;


ALTER FUNCTION "public"."user_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_restaurant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'restaurant_id')::UUID,
    NULL
  );
END;
$$;


ALTER FUNCTION "public"."user_restaurant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'server'
  );
END;
$$;


ALTER FUNCTION "public"."user_role"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "birthday" "date",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "loyalty_points" integer DEFAULT 0,
    "total_visits" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "sale_date" "date" NOT NULL,
    "total_orders" integer DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "total_tax" numeric(10,2) DEFAULT 0,
    "total_tips" numeric(10,2) DEFAULT 0,
    "cash_sales" numeric(10,2) DEFAULT 0,
    "card_sales" numeric(10,2) DEFAULT 0,
    "digital_wallet_sales" numeric(10,2) DEFAULT 0,
    "refunds" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "supplier_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "unit" "text" NOT NULL,
    "current_stock" numeric(10,3) DEFAULT 0 NOT NULL,
    "minimum_stock" numeric(10,3) DEFAULT 0 NOT NULL,
    "maximum_stock" numeric(10,3),
    "unit_cost" numeric(10,2),
    "category" "text",
    "storage_location" "text",
    "expiry_tracking" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_item_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price_modifier" numeric(10,2) DEFAULT 0,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_item_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "cost_price" numeric(10,2),
    "image_url" "text",
    "prep_time" integer DEFAULT 10,
    "calories" integer,
    "allergens" "text"[],
    "dietary_info" "text"[],
    "is_available" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_item_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_item_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_item_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "special_instructions" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "order_items_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'preparing'::"text", 'ready'::"text", 'served'::"text"])))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "table_id" "uuid",
    "customer_name" "text",
    "customer_phone" "text",
    "order_number" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "order_type" "text" DEFAULT 'dine_in'::"text" NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_method" "text",
    "server_id" "uuid",
    "kitchen_notes" "text",
    "estimated_prep_time" integer,
    "actual_prep_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "orders_order_type_check" CHECK (("order_type" = ANY (ARRAY['dine_in'::"text", 'takeaway'::"text", 'delivery'::"text"]))),
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text", 'digital_wallet'::"text"]))),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'preparing'::"text", 'ready'::"text", 'served'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "website" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "billing_address" "text",
    "subscription_plan" "text" DEFAULT 'basic'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organizations_subscription_plan_check" CHECK (("subscription_plan" = ANY (ARRAY['basic'::"text", 'premium'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "payment_reference" "text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text", 'digital_wallet'::"text"]))),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "payment_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['payment'::"text", 'refund'::"text", 'tip'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipt_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "header_text" "text",
    "footer_text" "text",
    "logo_url" "text",
    "paper_size" "text" DEFAULT 'thermal_80mm'::"text",
    "font_size" integer DEFAULT 12,
    "is_default" boolean DEFAULT false,
    "template_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "receipt_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['order'::"text", 'kitchen'::"text", 'customer'::"text"])))
);


ALTER TABLE "public"."receipt_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "receipt_type" "text" NOT NULL,
    "receipt_number" "text" NOT NULL,
    "template_id" "uuid",
    "receipt_data" "jsonb" NOT NULL,
    "print_count" integer DEFAULT 0,
    "last_printed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "restaurant_id" "uuid" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "generated_by" "uuid",
    CONSTRAINT "receipts_receipt_type_check" CHECK (("receipt_type" = ANY (ARRAY['payment'::"text", 'refund'::"text", 'void'::"text", 'customer'::"text", 'kitchen'::"text", 'merchant'::"text"])))
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurant_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "table_number" integer NOT NULL,
    "table_name" "text",
    "seats" integer DEFAULT 4 NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "current_order_id" "uuid",
    "qr_code_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "restaurant_tables_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'occupied'::"text", 'reserved'::"text", 'cleaning'::"text"])))
);


ALTER TABLE "public"."restaurant_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "logo_url" "text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "currency" "text" DEFAULT 'USD'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "restaurant_id" "uuid",
    "full_name" "text",
    "role" "text" DEFAULT 'server'::"text" NOT NULL,
    "phone" "text",
    "is_active" boolean DEFAULT true,
    "hire_date" "date" DEFAULT CURRENT_DATE,
    "hourly_rate" numeric(10,2),
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "staff_hierarchy_check" CHECK (((("role" = 'super_admin'::"text") AND ("organization_id" IS NULL) AND ("restaurant_id" IS NULL)) OR (("role" = 'org_admin'::"text") AND ("organization_id" IS NOT NULL) AND ("restaurant_id" IS NULL)) OR (("role" = ANY (ARRAY['manager'::"text", 'server'::"text", 'kitchen'::"text", 'cashier'::"text"])) AND ("organization_id" IS NOT NULL) AND ("restaurant_id" IS NOT NULL)))),
    CONSTRAINT "staff_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'org_admin'::"text", 'manager'::"text", 'server'::"text", 'kitchen'::"text", 'cashier'::"text"])))
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "staff_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."staff_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inventory_item_id" "uuid" NOT NULL,
    "movement_type" "text" NOT NULL,
    "quantity" numeric(10,3) NOT NULL,
    "unit_cost" numeric(10,2),
    "reference_id" "uuid",
    "notes" "text",
    "staff_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['purchase'::"text", 'usage'::"text", 'waste'::"text", 'adjustment'::"text"])))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "payment_terms" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_sales"
    ADD CONSTRAINT "daily_sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_sales"
    ADD CONSTRAINT "daily_sales_restaurant_id_sale_date_key" UNIQUE ("restaurant_id", "sale_date");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_restaurant_id_name_key" UNIQUE ("restaurant_id", "name");



ALTER TABLE ONLY "public"."menu_item_variants"
    ADD CONSTRAINT "menu_item_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_item_variants"
    ADD CONSTRAINT "order_item_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_settings"
    ADD CONSTRAINT "organization_settings_organization_id_setting_key_key" UNIQUE ("organization_id", "setting_key");



ALTER TABLE ONLY "public"."organization_settings"
    ADD CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipt_templates"
    ADD CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_restaurant_id_table_number_key" UNIQUE ("restaurant_id", "table_number");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_organization_id_name_key" UNIQUE ("organization_id", "name");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_schedules"
    ADD CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_schedules"
    ADD CONSTRAINT "staff_schedules_staff_id_day_of_week_key" UNIQUE ("staff_id", "day_of_week");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_customers_restaurant_id" ON "public"."customers" USING "btree" ("restaurant_id");



CREATE INDEX "idx_daily_sales_date" ON "public"."daily_sales" USING "btree" ("sale_date");



CREATE INDEX "idx_daily_sales_restaurant_id" ON "public"."daily_sales" USING "btree" ("restaurant_id");



CREATE INDEX "idx_inventory_items_restaurant_id" ON "public"."inventory_items" USING "btree" ("restaurant_id");



CREATE INDEX "idx_menu_items_category_id" ON "public"."menu_items" USING "btree" ("category_id");



CREATE INDEX "idx_menu_items_restaurant_id" ON "public"."menu_items" USING "btree" ("restaurant_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_restaurant_id" ON "public"."orders" USING "btree" ("restaurant_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_receipts_generated_at" ON "public"."receipts" USING "btree" ("generated_at");



CREATE INDEX "idx_receipts_restaurant_id" ON "public"."receipts" USING "btree" ("restaurant_id");



CREATE INDEX "idx_restaurant_tables_restaurant_id" ON "public"."restaurant_tables" USING "btree" ("restaurant_id");



CREATE INDEX "idx_restaurants_organization_id" ON "public"."restaurants" USING "btree" ("organization_id");



CREATE INDEX "idx_staff_organization_id" ON "public"."staff" USING "btree" ("organization_id");



CREATE INDEX "idx_staff_restaurant_id" ON "public"."staff" USING "btree" ("restaurant_id");



CREATE OR REPLACE TRIGGER "generate_order_number_trigger" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."generate_order_number"();



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_daily_sales_updated_at" BEFORE UPDATE ON "public"."daily_sales" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inventory_items_updated_at" BEFORE UPDATE ON "public"."inventory_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_menu_categories_updated_at" BEFORE UPDATE ON "public"."menu_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_menu_items_updated_at" BEFORE UPDATE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_order_items_updated_at" BEFORE UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organization_settings_updated_at" BEFORE UPDATE ON "public"."organization_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_receipt_templates_updated_at" BEFORE UPDATE ON "public"."receipt_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_restaurant_tables_updated_at" BEFORE UPDATE ON "public"."restaurant_tables" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_restaurants_updated_at" BEFORE UPDATE ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_schedules_updated_at" BEFORE UPDATE ON "public"."staff_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_updated_at" BEFORE UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_sales"
    ADD CONSTRAINT "daily_sales_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_item_variants"
    ADD CONSTRAINT "menu_item_variants_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_item_variants"
    ADD CONSTRAINT "order_item_variants_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_item_variants"
    ADD CONSTRAINT "order_item_variants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."menu_item_variants"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables"("id");



ALTER TABLE ONLY "public"."organization_settings"
    ADD CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."receipt_templates"
    ADD CONSTRAINT "receipt_templates_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."receipt_templates"("id");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_schedules"
    ADD CONSTRAINT "staff_schedules_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



CREATE POLICY "Customers access control" ON "public"."customers" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Daily sales access control" ON "public"."daily_sales" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Inventory items access control" ON "public"."inventory_items" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Menu categories delete policy" ON "public"."menu_categories" FOR DELETE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR (("public"."user_organization_id"() = "restaurants"."organization_id") AND ("public"."user_role"() = ANY (ARRAY['org_admin'::"text", 'manager'::"text"]))) OR (("public"."user_restaurant_id"() = "restaurants"."id") AND ("public"."user_role"() = 'manager'::"text"))))));



CREATE POLICY "Menu categories insert policy" ON "public"."menu_categories" FOR INSERT WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR (("public"."user_organization_id"() = "restaurants"."organization_id") AND ("public"."user_role"() = ANY (ARRAY['org_admin'::"text", 'manager'::"text"]))) OR (("public"."user_restaurant_id"() = "restaurants"."id") AND ("public"."user_role"() = 'manager'::"text"))))));



CREATE POLICY "Menu categories select policy" ON "public"."menu_categories" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Menu categories update policy" ON "public"."menu_categories" FOR UPDATE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR (("public"."user_organization_id"() = "restaurants"."organization_id") AND ("public"."user_role"() = ANY (ARRAY['org_admin'::"text", 'manager'::"text"]))) OR (("public"."user_restaurant_id"() = "restaurants"."id") AND ("public"."user_role"() = 'manager'::"text")))))) WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR (("public"."user_organization_id"() = "restaurants"."organization_id") AND ("public"."user_role"() = ANY (ARRAY['org_admin'::"text", 'manager'::"text"]))) OR (("public"."user_restaurant_id"() = "restaurants"."id") AND ("public"."user_role"() = 'manager'::"text"))))));



CREATE POLICY "Menu item variants access control" ON "public"."menu_item_variants" FOR SELECT USING (("menu_item_id" IN ( SELECT "menu_items"."id"
   FROM "public"."menu_items"
  WHERE ("menu_items"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Menu items delete policy" ON "public"."menu_items" FOR DELETE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR (("public"."user_organization_id"() = "restaurants"."organization_id") AND ("public"."user_role"() = ANY (ARRAY['org_admin'::"text", 'manager'::"text"]))) OR (("public"."user_restaurant_id"() = "restaurants"."id") AND ("public"."user_role"() = 'manager'::"text"))))));



CREATE POLICY "Menu items insert policy" ON "public"."menu_items" FOR INSERT WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR (("public"."user_organization_id"() = "restaurants"."organization_id") AND ("public"."user_role"() = ANY (ARRAY['org_admin'::"text", 'manager'::"text"]))) OR (("public"."user_restaurant_id"() = "restaurants"."id") AND ("public"."user_role"() = 'manager'::"text"))))));



CREATE POLICY "Menu items select policy" ON "public"."menu_items" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Menu items update policy" ON "public"."menu_items" FOR UPDATE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id"))))) WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Order item variants access control" ON "public"."order_item_variants" FOR SELECT USING (("order_item_id" IN ( SELECT "order_items"."id"
   FROM "public"."order_items"
  WHERE ("order_items"."order_id" IN ( SELECT "orders"."id"
           FROM "public"."orders"
          WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
                   FROM "public"."restaurants"
                  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))))));



CREATE POLICY "Order items access control" ON "public"."order_items" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Org admins can delete restaurants in their organization" ON "public"."restaurants" FOR DELETE USING (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can delete staff in their organization" ON "public"."staff" FOR DELETE USING ((("public"."user_organization_id"() = "organization_id") AND ("role" = ANY (ARRAY['manager'::"text", 'server'::"text", 'kitchen'::"text", 'cashier'::"text"]))));



CREATE POLICY "Org admins can insert restaurants in their organization" ON "public"."restaurants" FOR INSERT WITH CHECK (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can insert staff in their organization" ON "public"."staff" FOR INSERT WITH CHECK ((("public"."user_organization_id"() = "organization_id") AND ("role" = ANY (ARRAY['manager'::"text", 'server'::"text", 'kitchen'::"text", 'cashier'::"text"]))));



CREATE POLICY "Org admins can manage restaurants in their organization" ON "public"."restaurants" USING (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can manage their organization settings" ON "public"."organization_settings" USING (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can update restaurants in their organization" ON "public"."restaurants" FOR UPDATE USING (("public"."user_organization_id"() = "organization_id")) WITH CHECK (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can update staff in their organization" ON "public"."staff" FOR UPDATE USING ((("public"."user_organization_id"() = "organization_id") AND ("role" = ANY (ARRAY['manager'::"text", 'server'::"text", 'kitchen'::"text", 'cashier'::"text"])))) WITH CHECK ((("public"."user_organization_id"() = "organization_id") AND ("role" = ANY (ARRAY['manager'::"text", 'server'::"text", 'kitchen'::"text", 'cashier'::"text"]))));



CREATE POLICY "Org admins can update their organization" ON "public"."organizations" FOR UPDATE USING (("public"."user_organization_id"() = "id")) WITH CHECK (("public"."user_organization_id"() = "id"));



CREATE POLICY "Org admins can view restaurants in their organization" ON "public"."restaurants" FOR SELECT USING (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can view staff in their organization" ON "public"."staff" FOR SELECT USING (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Org admins can view their organization" ON "public"."organizations" FOR SELECT USING (("public"."user_organization_id"() = "id"));



CREATE POLICY "Org admins can view their organization settings" ON "public"."organization_settings" FOR SELECT USING (("public"."user_organization_id"() = "organization_id"));



CREATE POLICY "Payment transactions access control" ON "public"."payment_transactions" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Receipt templates access control" ON "public"."receipt_templates" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Receipts delete policy" ON "public"."receipts" FOR DELETE USING (("restaurant_id" IN ( SELECT "r"."id"
   FROM "public"."restaurants" "r"
  WHERE ("r"."organization_id" = "public"."user_organization_id"()))));



CREATE POLICY "Receipts insert policy" ON "public"."receipts" FOR INSERT WITH CHECK (("restaurant_id" IN ( SELECT "r"."id"
   FROM "public"."restaurants" "r"
  WHERE ("r"."organization_id" = "public"."user_organization_id"()))));



CREATE POLICY "Receipts select policy" ON "public"."receipts" FOR SELECT USING (("restaurant_id" IN ( SELECT "r"."id"
   FROM "public"."restaurants" "r"
  WHERE ("r"."organization_id" = "public"."user_organization_id"()))));



CREATE POLICY "Receipts update policy" ON "public"."receipts" FOR UPDATE USING (("restaurant_id" IN ( SELECT "r"."id"
   FROM "public"."restaurants" "r"
  WHERE ("r"."organization_id" = "public"."user_organization_id"())))) WITH CHECK (("restaurant_id" IN ( SELECT "r"."id"
   FROM "public"."restaurants" "r"
  WHERE ("r"."organization_id" = "public"."user_organization_id"()))));



CREATE POLICY "Restaurant access controls orders" ON "public"."orders" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant staff can delete order items" ON "public"."order_items" FOR DELETE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Restaurant staff can delete orders" ON "public"."orders" FOR DELETE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant staff can insert order items" ON "public"."order_items" FOR INSERT WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Restaurant staff can insert orders" ON "public"."orders" FOR INSERT WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant staff can update order items" ON "public"."order_items" FOR UPDATE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id"))))))) WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Restaurant staff can update orders" ON "public"."orders" FOR UPDATE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id"))))) WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant staff can view staff in their restaurant" ON "public"."staff" FOR SELECT USING (("public"."user_restaurant_id"() = "restaurant_id"));



CREATE POLICY "Restaurant staff can view their restaurant" ON "public"."restaurants" FOR SELECT USING (("public"."user_restaurant_id"() = "id"));



CREATE POLICY "Restaurant tables delete policy" ON "public"."restaurant_tables" FOR DELETE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant tables insert policy" ON "public"."restaurant_tables" FOR INSERT WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant tables select policy" ON "public"."restaurant_tables" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Restaurant tables update policy" ON "public"."restaurant_tables" FOR UPDATE USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id"))))) WITH CHECK (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Staff schedules access control" ON "public"."staff_schedules" FOR SELECT USING (("staff_id" IN ( SELECT "staff"."id"
   FROM "public"."staff"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "staff"."organization_id") OR ("public"."user_restaurant_id"() = "staff"."restaurant_id") OR ("auth"."uid"() = "staff"."id")))));



CREATE POLICY "Stock movements access control" ON "public"."stock_movements" FOR SELECT USING (("inventory_item_id" IN ( SELECT "inventory_items"."id"
   FROM "public"."inventory_items"
  WHERE ("inventory_items"."restaurant_id" IN ( SELECT "restaurants"."id"
           FROM "public"."restaurants"
          WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))))));



CREATE POLICY "Super admins can delete all staff" ON "public"."staff" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can delete organizations" ON "public"."organizations" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can delete restaurants" ON "public"."restaurants" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can insert organizations" ON "public"."organizations" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can insert restaurants" ON "public"."restaurants" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can insert staff" ON "public"."staff" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can manage all organization settings" ON "public"."organization_settings" USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can manage all organizations" ON "public"."organizations" USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can manage all restaurants" ON "public"."restaurants" USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can update all organizations" ON "public"."organizations" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can update all restaurants" ON "public"."restaurants" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can update all staff" ON "public"."staff" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all organization settings" ON "public"."organization_settings" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all organizations" ON "public"."organizations" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all restaurants" ON "public"."restaurants" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all staff" ON "public"."staff" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Suppliers access control" ON "public"."suppliers" FOR SELECT USING (("restaurant_id" IN ( SELECT "restaurants"."id"
   FROM "public"."restaurants"
  WHERE ("public"."is_super_admin"() OR ("public"."user_organization_id"() = "restaurants"."organization_id") OR ("public"."user_restaurant_id"() = "restaurants"."id")))));



CREATE POLICY "Users can update their own staff record" ON "public"."staff" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND ("role" = ( SELECT "staff_1"."role"
   FROM "public"."staff" "staff_1"
  WHERE ("staff_1"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own staff record" ON "public"."staff" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_item_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_item_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipt_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurant_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_restaurant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_restaurant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_restaurant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_role"() TO "service_role";


















GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."daily_sales" TO "anon";
GRANT ALL ON TABLE "public"."daily_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_sales" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."menu_categories" TO "anon";
GRANT ALL ON TABLE "public"."menu_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_categories" TO "service_role";



GRANT ALL ON TABLE "public"."menu_item_variants" TO "anon";
GRANT ALL ON TABLE "public"."menu_item_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_item_variants" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_item_variants" TO "anon";
GRANT ALL ON TABLE "public"."order_item_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."order_item_variants" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."organization_settings" TO "anon";
GRANT ALL ON TABLE "public"."organization_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_settings" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."receipt_templates" TO "anon";
GRANT ALL ON TABLE "public"."receipt_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."receipt_templates" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_tables" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_tables" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."staff_schedules" TO "anon";
GRANT ALL ON TABLE "public"."staff_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























\unrestrict l3xeb776ac5dZyV3Mu6SBHpctFdbQUYwo2erVOcas9B0QXdFBkd6agDqMYF4Ivj

RESET ALL;
