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
        const { data: updatedRestaurant, error } = await supabase
            .from('restaurants')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .select(`
                *,
                organization:organizations(name)
            `)
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ restaurant: updatedRestaurant })

    } catch (error) {
        console.error('Error updating restaurant:', error)
        return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
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
            .from('restaurants')
            .delete()
            .eq('id', params.id)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting restaurant:', error)
        return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 })
    }
}
