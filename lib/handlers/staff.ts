import { createClient } from '@/lib/supabase/server'
import type { UserType } from '@/lib/types'

export async function getStaffByOrganization(organizationId: string): Promise<UserType[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name')

    if (error) {
        console.error('Error fetching staff:', error)
        return []
    }

    return data || []
}

export async function getStaffByRestaurant(restaurantId: string): Promise<UserType[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('full_name')

    if (error) {
        console.error('Error fetching restaurant staff:', error)
        return []
    }

    return data || []
}

export async function createStaff(staffData: {
    email: string
    full_name: string
    role: string
    organization_id: string
    restaurant_id?: string | null
    permissions?: string[]
}): Promise<UserType | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('staff')
        .insert({
            email: staffData.email,
            full_name: staffData.full_name,
            role: staffData.role,
            organization_id: staffData.organization_id,
            restaurant_id: staffData.restaurant_id,
            permissions: staffData.permissions || [],
            is_active: true
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating staff:', error)
        throw new Error(error.message)
    }

    return data
}

export async function updateStaff(id: string, staffData: Partial<{
    full_name: string
    role: string
    restaurant_id: string | null
    permissions: string[]
    is_active: boolean
}>): Promise<UserType | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('staff')
        .update(staffData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating staff:', error)
        throw new Error(error.message)
    }

    return data
}

export async function deleteStaff(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting staff:', error)
        throw new Error(error.message)
    }
}

export async function getStaffById(id: string): Promise<UserType | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching staff member:', error)
        return null
    }

    return data
}
