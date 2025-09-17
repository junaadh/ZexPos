import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('org_id')

        const supabase = await createClient()
        const adminSupabase = createAdminClient()

        let query = supabase.from('staff').select(`
            *,
            organization:organizations(name),
            restaurant:restaurants(name)
        `)

        if (orgId) {
            query = query.eq('organization_id', orgId)
        }

        const { data: staff, error } = await query.order('full_name')

        if (error) {
            throw error
        }

        // Get email addresses from auth.users for each staff member
        const staffWithEmails = await Promise.all(
            (staff || []).map(async (staffMember) => {
                const { data: authUser } = await adminSupabase.auth.admin.getUserById(staffMember.id)
                return {
                    ...staffMember,
                    email: authUser?.user?.email || null
                }
            })
        )

        return NextResponse.json({ staff: staffWithEmails || [] })

    } catch (error) {
        console.error('Error fetching staff:', error)
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
        const { email, password, name, role, organization_id, restaurant_id } = body

        if (!email || !password || !name || !role || !organization_id) {
            return NextResponse.json({
                error: 'Missing required fields: email, password, name, role, organization_id'
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
                restaurant_id,
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
            restaurant_id: restaurant_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data: newStaff, error } = await supabase
            .from('staff')
            .insert(staffData)
            .select(`
                *,
                organization:organizations(name),
                restaurant:restaurants(name)
            `)
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

        return NextResponse.json({ staff: staffWithEmail })

    } catch (error) {
        console.error('Error creating staff:', error)
        return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
    }
}
