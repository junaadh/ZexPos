-- =====================================================
-- ZEX-POS: Minimal Order Workflow SQL Updates
-- =====================================================

-- 1. Ensure orders table has basic columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_number VARCHAR(10);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Add metadata column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Ensure order_items has required columns
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- 4. Update total_price for existing records
UPDATE order_items 
SET total_price = unit_price * quantity 
WHERE total_price IS NULL;

-- 5. Set completed_at for existing completed orders
UPDATE orders 
SET completed_at = updated_at 
WHERE status IN ('completed', 'served', 'ready') AND completed_at IS NULL;

-- 6. Update old status values to new ones
UPDATE orders SET status = 'confirmed' WHERE status = 'preparing';
UPDATE orders SET status = 'completed' WHERE status IN ('ready', 'served');

-- 7. Add sample restaurant metadata
UPDATE restaurants 
SET metadata = jsonb_build_object(
    'gst_rate', '10.0',
    'service_charge_rate', '5.0',
    'auto_print_kitchen_tickets', true,
    'show_gst_on_receipt', false,
    'show_service_charge_on_receipt', false
)
WHERE metadata = '{}' OR metadata IS NULL;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status 
ON orders(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_completed_at 
ON orders(restaurant_id, completed_at) 
WHERE status = 'completed';

-- 9. Create trigger function for completed_at
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS orders_set_completed_at ON orders;
CREATE TRIGGER orders_set_completed_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at();

-- 10. Verify changes
SELECT 'Setup complete' as status, 
       COUNT(*) as total_orders,
       COUNT(CASE WHEN metadata != '{}' THEN 1 END) as restaurants_with_metadata
FROM orders, restaurants;

COMMIT;
