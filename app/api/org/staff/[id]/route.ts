import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { user } = await getCurrentUserWithRole(['org_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        const supabase = await createClient()
        const { data: updatedStaff, error } = await supabase
            .from('staff')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .eq('organization_id', user.organization_id) // Ensure they can only update staff in their org
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ staff: updatedStaff })

    } catch (error) {
        console.error('Error updating staff:', error)
        return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { user } = await getCurrentUserWithRole(['org_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', params.id)
            .eq('organization_id', user.organization_id) // Ensure they can only delete staff in their org

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting staff:', error)
        return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
    }
}
