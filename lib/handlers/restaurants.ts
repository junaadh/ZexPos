import { createClient } from '@/lib/supabase/server'
import type { Restaurant } from '@/lib/types'

export async function getRestaurantsByOrganization(organizationId: string): Promise<Restaurant[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')

    if (error) {
        console.error('Error fetching restaurants:', error)
        return []
    }

    return data || []
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching restaurant:', error)
        return null
    }

    return data
}

export async function createRestaurant(restaurantData: Partial<Restaurant>): Promise<Restaurant | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurantData)
        .select()
        .single()

    if (error) {
        console.error('Error creating restaurant:', error)
        throw new Error(error.message)
    }

    return data
}

export async function updateRestaurant(id: string, restaurantData: Partial<Restaurant>): Promise<Restaurant | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('restaurants')
        .update(restaurantData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating restaurant:', error)
        throw new Error(error.message)
    }

    return data
}

export async function deleteRestaurant(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting restaurant:', error)
        throw new Error(error.message)
    }
}
