-- =====================================================
-- ZEX-POS: Order Workflow & Reporting SQL Updates
-- =====================================================

-- 1. Update Orders table to support new workflow
-- Add table_number column and update status enum
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_number VARCHAR(10);

-- Update the status enum to match new workflow
-- First, create the order_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- If the enum already exists, add the new 'confirmed' value
DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE 'confirmed';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Make sure the orders table uses the enum type
-- If it's currently using VARCHAR, we'll update it
DO $$ BEGIN
    -- Check if the column exists and update its type if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'status'
    ) THEN
        -- If it's not already using the enum, convert it
        ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;
    ELSE
        -- If the column doesn't exist, add it
        ALTER TABLE orders ADD COLUMN status order_status DEFAULT 'pending';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, just ensure we have a status column
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
END $$;

-- If you need to remove old status values, you'll need to:
-- 1. Update existing records to use new statuses
-- 2. Create a new enum type
-- 3. Alter the column to use the new type
-- 4. Drop the old enum type

-- Update existing orders to use new status values (only if they exist)
UPDATE orders 
SET status = 'confirmed' 
WHERE status = 'preparing' AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status'
);

UPDATE orders 
SET status = 'completed' 
WHERE status IN ('ready', 'served') AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status'
);

-- 2. Add metadata column to restaurants table for GST/service charge settings
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Add completed_at timestamp for order completion tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing completed orders
UPDATE orders 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;

-- 4. Create index for better performance on end-of-day reports
CREATE INDEX IF NOT EXISTS idx_orders_completed_at 
ON orders(restaurant_id, completed_at) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(restaurant_id, status, created_at);

-- 5. Update order_items table to include status for kitchen ticket workflow
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Create enum for order_item status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE order_item_status AS ENUM ('pending', 'printed', 'preparing', 'ready');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the column to use the enum (optional, can stay as VARCHAR)
-- ALTER TABLE order_items ALTER COLUMN status TYPE order_item_status USING status::order_item_status;

-- 6. Add total_price column to order_items for better reporting
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- Calculate total_price for existing records
UPDATE order_items 
SET total_price = unit_price * quantity 
WHERE total_price IS NULL;

-- 7. Sample restaurant metadata for GST and service charge
-- Update your restaurants with sample settings
UPDATE restaurants 
SET metadata = jsonb_build_object(
    'gst_rate', '10.0',
    'service_charge_rate', '5.0',
    'auto_print_kitchen_tickets', true,
    'show_gst_on_receipt', false,
    'show_service_charge_on_receipt', false
)
WHERE metadata = '{}' OR metadata IS NULL;

-- 8. Add RLS policies for new workflow
-- Policy for order editing (pending and confirmed orders only)
DROP POLICY IF EXISTS "Users can edit pending/confirmed orders" ON orders;
CREATE POLICY "Users can edit pending/confirmed orders" ON orders
    FOR UPDATE
    USING (
        status IN ('pending', 'confirmed') AND
        (
            -- Staff can edit orders in their restaurant
            (auth.jwt() ->> 'restaurant_id')::uuid = restaurant_id OR
            -- Org admins can edit orders in their organization's restaurants
            (
                (auth.jwt() ->> 'role') = 'org_admin' AND
                restaurant_id IN (
                    SELECT id FROM restaurants 
                    WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
                )
            ) OR
            -- Super admins can edit any order
            (auth.jwt() ->> 'role') = 'super_admin'
        )
    );

-- Policy for end-of-day reports (completed orders only)
DROP POLICY IF EXISTS "Users can view completed orders for reports" ON orders;
CREATE POLICY "Users can view completed orders for reports" ON orders
    FOR SELECT
    USING (
        status = 'completed' AND
        (
            -- Staff can view reports for their restaurant
            (auth.jwt() ->> 'restaurant_id')::uuid = restaurant_id OR
            -- Org admins can view reports for their organization's restaurants
            (
                (auth.jwt() ->> 'role') = 'org_admin' AND
                restaurant_id IN (
                    SELECT id FROM restaurants 
                    WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
                )
            ) OR
            -- Super admins can view any reports
            (auth.jwt() ->> 'role') = 'super_admin'
        )
    );

-- 9. Create a function to automatically set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic completed_at setting
DROP TRIGGER IF EXISTS orders_set_completed_at ON orders;
CREATE TRIGGER orders_set_completed_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at();

-- 10. Update existing data to ensure consistency
-- Ensure all order items have proper total_price
UPDATE order_items 
SET total_price = unit_price * quantity 
WHERE total_price IS NULL OR total_price = 0;

-- Ensure all orders have proper total_amount
UPDATE orders 
SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM order_items 
    WHERE order_id = orders.id
)
WHERE id IN (
    SELECT DISTINCT order_id 
    FROM order_items 
    WHERE order_id IS NOT NULL
);

-- 11. Create view for easy reporting queries
CREATE OR REPLACE VIEW order_summary_view AS
SELECT 
    o.id,
    o.order_number,
    o.restaurant_id,
    r.name as restaurant_name,
    o.status,
    o.customer_name,
    o.table_number,
    o.total_amount,
    o.created_at,
    o.completed_at,
    o.kitchen_notes,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_items,
    EXTRACT(EPOCH FROM (o.completed_at - o.created_at))/60 as completion_minutes
FROM orders o
LEFT JOIN restaurants r ON o.restaurant_id = r.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, r.name;

-- Grant permissions on the view
GRANT SELECT ON order_summary_view TO authenticated;

-- 12. Verify the changes
SELECT 'Orders table updated' as status, COUNT(*) as total_orders FROM orders;
SELECT 'Order items updated' as status, COUNT(*) as total_items FROM order_items WHERE total_price IS NOT NULL;
SELECT 'Restaurants with metadata' as status, COUNT(*) as total FROM restaurants WHERE metadata != '{}';

COMMIT;
