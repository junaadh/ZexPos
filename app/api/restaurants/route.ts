// =============================================================================
// RESTAURANTS API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant
} from '@/lib/database'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user metadata to check organization
        const organizationId = user.user_metadata?.organization_id
        const role = user.user_metadata?.role

        if (!organizationId && role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 403 }
            )
        }

        // Get restaurants - for now getRestaurants handles all
        // TODO: Enhance getRestaurants to accept organizationId parameter
        const result = await getRestaurants()

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        // Filter by organization if not super_admin
        let restaurants = result.data
        if (role !== 'super_admin' && organizationId) {
            restaurants = restaurants?.filter(restaurant =>
                restaurant.organization_id === organizationId
            ) || []
        }

        return NextResponse.json(restaurants)
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Only super_admin and org_admin can create restaurants
        const role = user.user_metadata?.role
        const organizationId = user.user_metadata?.organization_id

        if (!['super_admin', 'org_admin'].includes(role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Ensure organization_id is set correctly
        if (role === 'org_admin' && organizationId) {
            body.organization_id = organizationId
        }

        const result = await createRestaurant(body)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const result = await updateRestaurant(id, body)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data)
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}
