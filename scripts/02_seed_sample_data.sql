-- =============================================================================
-- ZEX-POS SAMPLE DATA WITH ORGANIZATION SUPPORT
-- =============================================================================
-- Sample data for development and testing including organizations

-- Insert sample organization
INSERT INTO public.organizations (id, name, description, logo_url, website, contact_email, contact_phone, billing_address, subscription_plan, is_active) VALUES
('650e8400-e29b-41d4-a716-446655440000', 'Demo Restaurant Group', 'A sample restaurant organization for testing', NULL, 'https://demorestaurants.com', 'info@demorestaurants.com', '(555) 123-4567', '123 Business Ave, City, State', 'premium', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample restaurants under the organization
INSERT INTO public.restaurants (id, organization_id, name, address, phone, email, logo_url) VALUES
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'Demo Restaurant Downtown', '123 Main St, City, State', '(555) 123-4567', 'downtown@restaurant.com', NULL),
('551e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'Demo Restaurant Uptown', '456 Oak Ave, City, State', '(555) 123-4568', 'uptown@restaurant.com', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tables for downtown restaurant
INSERT INTO public.restaurant_tables (restaurant_id, table_number, seats, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, 4, 'available'),
('550e8400-e29b-41d4-a716-446655440000', 2, 2, 'available'),
('550e8400-e29b-41d4-a716-446655440000', 3, 6, 'occupied'),
('550e8400-e29b-41d4-a716-446655440000', 4, 4, 'available'),
('550e8400-e29b-41d4-a716-446655440000', 5, 8, 'reserved')
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- Insert sample tables for uptown restaurant
INSERT INTO public.restaurant_tables (restaurant_id, table_number, seats, status) VALUES
('551e8400-e29b-41d4-a716-446655440000', 1, 4, 'available'),
('551e8400-e29b-41d4-a716-446655440000', 2, 6, 'available'),
('551e8400-e29b-41d4-a716-446655440000', 3, 8, 'occupied')
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- Insert sample menu categories for downtown restaurant
INSERT INTO public.menu_categories (restaurant_id, name, description, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Appetizers', 'Start your meal with these delicious appetizers', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Main Courses', 'Our signature main dishes', 2),
('550e8400-e29b-41d4-a716-446655440000', 'Desserts', 'Sweet endings to your meal', 3),
('550e8400-e29b-41d4-a716-446655440000', 'Beverages', 'Refreshing drinks and beverages', 4);

-- Insert sample menu categories for uptown restaurant
INSERT INTO public.menu_categories (restaurant_id, name, description, sort_order) VALUES
('551e8400-e29b-41d4-a716-446655440000', 'Starters', 'Begin your dining experience', 1),
('551e8400-e29b-41d4-a716-446655440000', 'Entrees', 'Our chef specials', 2),
('551e8400-e29b-41d4-a716-446655440000', 'Desserts', 'Sweet treats', 3),
('551e8400-e29b-41d4-a716-446655440000', 'Drinks', 'Beverages and cocktails', 4);

-- Insert sample menu items for downtown restaurant
INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available, allergens, prep_time, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Appetizers' LIMIT 1), 'Caesar Salad', 'Fresh romaine lettuce with parmesan cheese and croutons', 12.99, true, ARRAY['dairy', 'gluten'], 10, 1),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Appetizers' LIMIT 1), 'Buffalo Wings', 'Spicy chicken wings served with ranch dressing', 14.99, true, ARRAY['dairy'], 15, 2),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Main Courses' LIMIT 1), 'Grilled Salmon', 'Fresh Atlantic salmon with seasonal vegetables', 24.99, true, ARRAY['fish'], 20, 1),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Main Courses' LIMIT 1), 'Ribeye Steak', 'Premium 12oz ribeye steak cooked to perfection', 32.99, true, NULL, 25, 2),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Desserts' LIMIT 1), 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 8.99, true, ARRAY['dairy', 'eggs', 'gluten'], 5, 1),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Beverages' LIMIT 1), 'Fresh Lemonade', 'House-made lemonade with fresh lemons', 4.99, true, NULL, 3, 1);

-- Insert sample menu items for uptown restaurant  
INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available, allergens, prep_time, sort_order) VALUES
('551e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '551e8400-e29b-41d4-a716-446655440000' AND name = 'Starters' LIMIT 1), 'Bruschetta', 'Toasted bread with fresh tomatoes and basil', 10.99, true, ARRAY['gluten'], 8, 1),
('551e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '551e8400-e29b-41d4-a716-446655440000' AND name = 'Entrees' LIMIT 1), 'Pasta Carbonara', 'Traditional Italian pasta with bacon and parmesan', 18.99, true, ARRAY['dairy', 'gluten', 'eggs'], 15, 1),
('551e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '551e8400-e29b-41d4-a716-446655440000' AND name = 'Desserts' LIMIT 1), 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 9.99, true, ARRAY['dairy', 'eggs'], 5, 1),
('551e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_categories WHERE restaurant_id = '551e8400-e29b-41d4-a716-446655440000' AND name = 'Drinks' LIMIT 1), 'Espresso', 'Strong Italian coffee', 3.99, true, NULL, 2, 1);

-- Insert sample staff for the organization
INSERT INTO public.staff (id, organization_id, restaurant_id, full_name, role, phone, is_active, hire_date, hourly_rate, permissions) VALUES
('760e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'John Manager', 'manager', '(555) 234-5678', true, '2024-01-15', 25.00, '["manage_orders", "manage_staff", "view_reports"]'),
('761e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Jane Server', 'server', '(555) 234-5679', true, '2024-02-01', 15.00, '["take_orders", "process_payments"]'),
('762e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', '551e8400-e29b-41d4-a716-446655440000', 'Mike Cook', 'kitchen', '(555) 234-5680', true, '2024-01-20', 18.00, '["manage_kitchen", "view_orders"]')
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders
INSERT INTO public.orders (id, restaurant_id, table_id, staff_id, customer_name, status, total_amount, tax_amount, tip_amount, payment_method, special_instructions, order_date) VALUES
('870e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.restaurant_tables WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND table_number = 3 LIMIT 1), '761e8400-e29b-41d4-a716-446655440000', 'John Doe', 'preparing', 45.97, 3.68, 9.00, 'credit_card', 'No onions on the burger', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items
INSERT INTO public.order_items (order_id, menu_item_id, quantity, unit_price, special_instructions) VALUES
('870e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_items WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Caesar Salad' LIMIT 1), 1, 12.99, NULL),
('870e8400-e29b-41d4-a716-446655440000', (SELECT id FROM public.menu_items WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Ribeye Steak' LIMIT 1), 1, 32.99, 'Medium rare');
