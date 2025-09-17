import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        const supabase = await createClient()
        const { data: organization, error } = await supabase
            .from('organizations')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json(organization)

    } catch (error) {
        console.error('Error updating organization:', error)
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', params.id)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting organization:', error)
        return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
    }
}
