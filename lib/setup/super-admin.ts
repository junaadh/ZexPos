// =============================================================================
// SUPER ADMIN SETUP UTILITY
// =============================================================================
// This utility helps create the initial super admin user programmatically

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Create admin client with service role for privileged operations
function createSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.service_role_key!

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing required Supabase environment variables for admin operations')
    }

    return createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

/**
 * Creates the initial super admin user
 * This should only be run once during system setup
 */
export async function createInitialSuperAdmin(
    email: string,
    password: string,
    fullName: string = 'System Administrator'
) {
    try {
        // Use admin client for privileged operations
        const adminClient = createSupabaseAdmin()

        // Use regular client for database operations
        const supabase = await createClient()

        // Step 1: Create the user via admin API
        const { data: user, error: signUpError } = await adminClient.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                full_name: fullName,
                role: 'super_admin',
                organization_id: null,
                restaurant_id: null
            },
            email_confirm: true // Auto-confirm the email
        })

        if (signUpError) {
            throw new Error(`Failed to create super admin user: ${signUpError.message}`)
        }

        if (!user?.user) {
            throw new Error('User creation returned no user data')
        }

        // Step 2: Create corresponding staff record
        const { error: staffError } = await supabase
            .from('staff')
            .insert({
                id: user.user.id,
                organization_id: null,
                restaurant_id: null,
                full_name: fullName,
                role: 'super_admin',
                is_active: true,
                permissions: ['manage_all', 'create_organizations', 'manage_users']
            })

        if (staffError) {
            console.warn('Failed to create staff record:', staffError.message)
            // Not critical, continue
        }

        return {
            success: true,
            user: user.user,
            message: 'Super admin created successfully'
        }

    } catch (error) {
        console.error('Super admin creation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to create super admin'
        }
    }
}

/**
 * Checks if any super admin exists in the system
 */
export async function checkSuperAdminExists(): Promise<boolean> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('staff')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1)

        if (error) {
            console.error('Error checking for super admin:', error.message)
            return false
        }

        return (data?.length || 0) > 0
    } catch (error) {
        console.error('Error checking for super admin:', error)
        return false
    }
}

/**
 * Environment-based super admin creation
 * Reads from environment variables for initial setup
 */
export async function createSuperAdminFromEnv() {
    const email = process.env.INITIAL_SUPER_ADMIN_EMAIL
    const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD
    const fullName = process.env.INITIAL_SUPER_ADMIN_NAME || 'System Administrator'

    if (!email || !password) {
        throw new Error(
            'INITIAL_SUPER_ADMIN_EMAIL and INITIAL_SUPER_ADMIN_PASSWORD environment variables must be set'
        )
    }

    // Check if super admin already exists
    const exists = await checkSuperAdminExists()
    if (exists) {
        return {
            success: true,
            message: 'Super admin already exists, skipping creation'
        }
    }

    return await createInitialSuperAdmin(email, password, fullName)
}
