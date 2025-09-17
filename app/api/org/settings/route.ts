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
        const { data: organization, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', user.organization_id)
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ organization })

    } catch (error) {
        console.error('Error fetching organization:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { user } = await getCurrentUserWithRole(['org_admin'])

        if (!user || !user.organization_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        const supabase = await createClient()
        const { data: updatedOrg, error } = await supabase
            .from('organizations')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', user.organization_id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ organization: updatedOrg })

    } catch (error) {
        console.error('Error updating organization:', error)
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }
}
