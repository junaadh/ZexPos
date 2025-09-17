// =============================================================================
// STAFF API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getStaff } from '@/lib/database'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
        return NextResponse.json(
            { error: 'Restaurant ID is required' },
            { status: 400 }
        )
    }

    const result = await getStaff(restaurantId)

    if (result.error) {
        return NextResponse.json(
            { error: result.error },
            { status: 500 }
        )
    }

    return NextResponse.json(result.data)
}

export async function POST(request: NextRequest) {
    try {
        const { user } = await getCurrentUserWithRole(['org_admin', 'manager'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { email, password, name, role, organization_id, restaurant_id } = body

        if (!email || !password || !name || !role || !organization_id || !restaurant_id) {
            return NextResponse.json({
                error: 'Missing required fields: email, password, name, role, organization_id, restaurant_id'
            }, { status: 400 })
        }

        const supabase = await createClient()
        const adminSupabase = createAdminClient()

        // First, create the user in Supabase Auth using admin client
        const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                "full_name": name,
                role,
                organization_id,
                restaurant_id
            }
        })

        if (authError) {
            throw new Error(`Failed to create user: ${authError.message}`)
        }

        if (!authUser.user) {
            throw new Error('User creation failed')
        }

        // Then create the staff record with the user's ID (email comes from auth.users)
        const staffData = {
            id: authUser.user.id,
            full_name: name,
            role,
            organization_id,
            restaurant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data: newStaff, error } = await supabase
            .from('staff')
            .insert(staffData)
            .select()
            .single()

        if (error) {
            // If staff creation fails, we should delete the auth user
            await adminSupabase.auth.admin.deleteUser(authUser.user.id)
            throw error
        }

        // Add email from auth user to the response
        const staffWithEmail = {
            ...newStaff,
            email: authUser.user.email
        }

        return NextResponse.json(staffWithEmail, { status: 201 })
    } catch (error) {
        console.error('Error creating staff:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create staff' },
            { status: 500 }
        )
    }
}
