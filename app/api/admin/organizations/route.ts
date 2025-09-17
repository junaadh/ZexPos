import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const { user } = await getCurrentUserWithRole(['super_admin'])

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const { data: organizations, error } = await supabase
            .from('organizations')
            .select('*')
            .order('name')

        if (error) {
            throw error
        }

        return NextResponse.json(organizations || [])

    } catch (error) {
        console.error('Error fetching organizations:', error)
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

        const supabase = await createClient()
        const { data: organization, error } = await supabase
            .from('organizations')
            .insert([body])
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json(organization)

    } catch (error) {
        console.error('Error creating organization:', error)
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }
}
