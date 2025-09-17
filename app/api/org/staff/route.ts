import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const { user } = await getCurrentUserWithRole(['org_admin'])

        if (!user || !user.organization_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const { data: staff, error } = await supabase
            .from('staff')
            .select('*')
            .eq('organization_id', user.organization_id)
            .order('full_name')

        if (error) {
            throw error
        }

        return NextResponse.json({ staff: staff || [] })

    } catch (error) {
        console.error('Error fetching staff:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['org_admin'])

        if (!user || !user.organization_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const staffData = {
            ...body,
            organization_id: user.organization_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const supabase = await createClient()
        const { data: newStaff, error } = await supabase
            .from('staff')
            .insert(staffData)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ staff: newStaff })

    } catch (error) {
        console.error('Error creating staff:', error)
        return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
    }
}
