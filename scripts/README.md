# Database Scripts

This folder contains the essential SQL 2.## Database Setup Instructions

1. **Initial Setup:**
   ```sql
   -- Run in Supabase SQL Editor
   \i 01_complete_schema.sql
   ```

2. **Create Super Admin:**
   Choose one of the methods above to create your initial super admin user.

3. **Add Sample Data (Optional for development):**
   ```sql
   -- Run in Supabase SQL Editor
   \i 02_seed_sample_data.sql
   ```

## Security Notes

- Super admin creation is restricted to prevent unauthorized access
- The `/setup` route is only accessible when no super admin exists
- Regular user signup requires an existing organization
- All data is isolated by organization using Row Level Security (RLS) in the script before running

## Database Setup Instructionscripts for the ZEX-POS multi-tenant system.

## Scripts Overview

### `01_complete_schema.sql`
**Primary database schema** - Contains the complete multi-tenant database structure for the restaurant POS system including:
- Multi-organization support with data isolation
- Restaurants, staff, tables management per organization
- Menu categories and items with image support
- Order management and tracking
- Inventory and supplier management
- Customer data and financials
- Receipt templates and generation
- Comprehensive RLS (Row Level Security) policies for multi-tenancy

**Usage:** Run this script first when setting up a new database instance.

### `02_seed_sample_data.sql`
**Sample data for development** - Provides demo data for testing the multi-tenant system including:
- Sample organization with two restaurants
- Demo tables and seating arrangements for both restaurants
- Menu categories and items for each restaurant
- Sample staff members with different roles
- Sample orders and order items

**Usage:** Run this after the main schema to populate with test data for development.

### `03_create_super_admin.sql`
**Initial super admin setup** - Creates the first super administrator user for the system:
- Creates super admin user with full system access
- Sets up proper user metadata and permissions
- Includes verification queries

**Usage:** Run this manually via Supabase dashboard after setting up the schema, OR use the automated setup methods below.

## Super Admin Setup Methods

### Method 1: Web Interface (Recommended)
1. After deploying your application, visit `/setup`
2. Fill in the super admin details
3. The system will create the super admin and redirect to login

### Method 2: Environment Variables + Script
1. Set environment variables:
   ```bash
   INITIAL_SUPER_ADMIN_EMAIL=admin@yourcompany.com
   INITIAL_SUPER_ADMIN_PASSWORD=your-secure-password
   INITIAL_SUPER_ADMIN_NAME="System Administrator"
   ```
2. Run the setup script:
   ```bash
   npx tsx scripts/setup.ts
   ```

### Method 3: Manual SQL (Database Direct)
1. Create a user via Supabase Auth
2. Run `03_create_super_admin.sql` with your user details
