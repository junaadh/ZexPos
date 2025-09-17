-- =============================================================================
-- ADD ORDER NUMBER GENERATION
-- =============================================================================
-- This script adds a function and trigger to automatically generate order numbers

-- Function to generate the next order number for a restaurant for the current day
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate order number before insert
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();
