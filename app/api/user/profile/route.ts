import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const { user, supabase } = await getCurrentUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile from staff table
        const { data: staffProfile, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('id', user.id)
            .single()

        if (staffError) {
            console.error('Error fetching staff profile:', staffError)
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
        }

        // Get user auth data
        const { data: authUser, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.error('Error fetching auth user:', authError)
            return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
        }

        const profile = {
            id: user.id,
            email: authUser.user?.email,
            full_name: staffProfile?.full_name || user.full_name,
            role: user.role,
            phone: staffProfile?.phone,
            organization_id: user.organization_id,
            restaurant_id: user.restaurant_id,
            is_active: staffProfile?.is_active,
            hire_date: staffProfile?.hire_date,
            hourly_rate: staffProfile?.hourly_rate,
            permissions: staffProfile?.permissions,
            created_at: staffProfile?.created_at,
            updated_at: staffProfile?.updated_at
        }

        return NextResponse.json({ profile })

    } catch (error) {
        console.error('Error fetching user profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { user, supabase } = await getCurrentUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { full_name, phone, email } = body

        // Update staff table
        const { data: updatedStaff, error: staffError } = await supabase
            .from('staff')
            .update({
                full_name,
                phone,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

        if (staffError) {
            console.error('Error updating staff profile:', staffError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        // Update auth user metadata if needed
        if (email && email !== user.email) {
            const { error: emailError } = await supabase.auth.updateUser({
                email: email
            })

            if (emailError) {
                console.error('Error updating email:', emailError)
                return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
            }
        }

        // Update user metadata with full_name
        if (full_name) {
            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    full_name: full_name,
                    role: user.role,
                    organization_id: user.organization_id,
                    restaurant_id: user.restaurant_id
                }
            })

            if (metadataError) {
                console.error('Error updating user metadata:', metadataError)
                // Don't fail the request for metadata update errors
            }
        }

        return NextResponse.json({
            profile: {
                ...updatedStaff,
                email: email || user.email
            }
        })

    } catch (error) {
        console.error('Error updating user profile:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
