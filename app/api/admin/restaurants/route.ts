import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('org_id')

        const supabase = await createClient()
        let query = supabase.from('restaurants').select(`
            *,
            organization:organizations(name)
        `)

        if (orgId) {
            query = query.eq('organization_id', orgId)
        }

        const { data: restaurants, error } = await query.order('name')

        if (error) {
            throw error
        }

        return NextResponse.json({ restaurants: restaurants || [] })

    } catch (error) {
        console.error('Error fetching restaurants:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const restaurantData = {
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const supabase = await createClient()
        const { data: newRestaurant, error } = await supabase
            .from('restaurants')
            .insert(restaurantData)
            .select(`
                *,
                organization:organizations(name)
            `)
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ restaurant: newRestaurant })

    } catch (error) {
        console.error('Error creating restaurant:', error)
        return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
    }
}
