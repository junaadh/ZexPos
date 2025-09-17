import { NextRequest, NextResponse } from 'next/server'
import { checkSuperAdminExists } from '@/lib/setup/super-admin'

export async function GET() {
    try {
        const exists = await checkSuperAdminExists()
        return NextResponse.json({ exists })
    } catch (error) {
        console.error('Error checking super admin:', error)
        return NextResponse.json(
            { error: 'Failed to check super admin status' },
            { status: 500 }
        )
    }
}
