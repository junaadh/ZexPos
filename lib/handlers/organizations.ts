import { createClient } from '@/lib/supabase/client'
import { Organization, OrganizationSettings } from '@/lib/types'

const supabase = createClient()

// =============================================================================
// ORGANIZATION HANDLERS
// =============================================================================

export async function getOrganizations(): Promise<Organization[]> {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching organizations:', error)
        return []
    }
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching organization:', error)
        return null
    }
}

export async function createOrganization(organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization | null> {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .insert([organization])
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error creating organization:', error)
        return null
    }
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating organization:', error)
        return null
    }
}

export async function deleteOrganization(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting organization:', error)
        return false
    }
}

// =============================================================================
// ORGANIZATION SETTINGS HANDLERS
// =============================================================================

export async function getOrganizationSettings(organizationId: string): Promise<OrganizationSettings[]> {
    try {
        const { data, error } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('organization_id', organizationId)
            .order('setting_key')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching organization settings:', error)
        return []
    }
}

export async function updateOrganizationSetting(
    organizationId: string,
    settingKey: string,
    settingValue: any
): Promise<OrganizationSettings | null> {
    try {
        const { data, error } = await supabase
            .from('organization_settings')
            .upsert({
                organization_id: organizationId,
                setting_key: settingKey,
                setting_value: settingValue,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating organization setting:', error)
        return null
    }
}

// =============================================================================
// ORGANIZATION-AWARE RESTAURANT HANDLERS
// =============================================================================

export async function getRestaurantsByOrganization(organizationId: string) {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching restaurants by organization:', error)
        return []
    }
}

export async function getUserAccessibleRestaurants(userId: string) {
    try {
        // Get user metadata to determine access level
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        const userMetadata = userData.user?.user_metadata
        const role = userMetadata?.role
        const organizationId = userMetadata?.organization_id
        const restaurantId = userMetadata?.restaurant_id

        let query = supabase.from('restaurants').select('*')

        // Apply access control based on role
        if (role === 'super_admin') {
            // Super admins can see all restaurants
            query = query.eq('is_active', true)
        } else if (role === 'org_admin' && organizationId) {
            // Org admins can see all restaurants in their organization
            query = query.eq('organization_id', organizationId).eq('is_active', true)
        } else if (restaurantId) {
            // Regular users can only see their assigned restaurant
            query = query.eq('id', restaurantId).eq('is_active', true)
        } else {
            // No access
            return []
        }

        const { data, error } = await query.order('name')
        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching accessible restaurants:', error)
        return []
    }
}

// =============================================================================
// ORGANIZATION-AWARE STAFF HANDLERS
// =============================================================================

export async function getStaffByOrganization(organizationId: string) {
    try {
        const { data, error } = await supabase
            .from('staff')
            .select(`
        *,
        restaurants:restaurant_id(name)
      `)
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('full_name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching staff by organization:', error)
        return []
    }
}

export async function createStaffMember(staff: {
    email: string
    password: string
    full_name: string
    role: string
    organization_id?: string
    restaurant_id?: string
    phone?: string
    hourly_rate?: number
}) {
    try {
        // First create the auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: staff.email,
            password: staff.password,
            user_metadata: {
                full_name: staff.full_name,
                role: staff.role,
                organization_id: staff.organization_id,
                restaurant_id: staff.restaurant_id
            }
        })

        if (authError) throw authError

        // Then create the staff record
        const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .insert([{
                id: authData.user.id,
                organization_id: staff.organization_id,
                restaurant_id: staff.restaurant_id,
                full_name: staff.full_name,
                role: staff.role,
                phone: staff.phone,
                hourly_rate: staff.hourly_rate
            }])
            .select()
            .single()

        if (staffError) throw staffError
        return staffData
    } catch (error) {
        console.error('Error creating staff member:', error)
        return null
    }
}
