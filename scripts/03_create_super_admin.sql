-- =============================================================================
-- INITIAL SUPER ADMIN SETUP
-- =============================================================================
-- This script creates the first super admin user for the system
-- Run this ONCE during initial system setup

-- Step 1: Create the super admin user in auth.users
-- Note: Replace with your actual super admin credentials
-- You can run this via Supabase dashboard or use the signup process

-- Step 2: Update the user metadata to set super_admin role
-- Replace 'your-super-admin-user-id' with the actual user ID from auth.users
UPDATE auth.users 
SET user_metadata = jsonb_build_object(
    'full_name', 'System Administrator',
    'role', 'super_admin',
    'organization_id', NULL,
    'restaurant_id', NULL
)
WHERE email = 'admin@yourcompany.com'; -- Replace with your super admin email

-- Step 3: Create staff record for the super admin (optional, for completeness)
-- This allows the super admin to appear in staff listings if needed
INSERT INTO public.staff (id, organization_id, restaurant_id, full_name, role, is_active)
SELECT 
    id,
    NULL, -- Super admin doesn't belong to any specific organization
    NULL, -- Super admin doesn't belong to any specific restaurant
    'System Administrator',
    'super_admin',
    true
FROM auth.users 
WHERE email = 'admin@yourcompany.com' -- Replace with your super admin email
ON CONFLICT (id) DO NOTHING;

-- Verification: Check that the super admin was created correctly
SELECT 
    u.id,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    u.user_metadata->>'role' as role,
    s.full_name as staff_name,
    s.role as staff_role
FROM auth.users u
LEFT JOIN public.staff s ON u.id = s.id
WHERE u.user_metadata->>'role' = 'super_admin';
