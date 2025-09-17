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
        const { data: restaurants, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('organization_id', user.organization_id)
            .order('name')

        if (error) {
            throw error
        }

        return NextResponse.json({ restaurants: restaurants || [] })

    } catch (error) {
        console.error('Error fetching restaurants:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
