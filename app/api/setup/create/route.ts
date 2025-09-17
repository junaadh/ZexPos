import { NextRequest, NextResponse } from 'next/server'
import { createInitialSuperAdmin, checkSuperAdminExists } from '@/lib/setup/super-admin'

export async function POST(request: Request) {
    try {
        // Check if super admin already exists
        const exists = await checkSuperAdminExists()
        if (exists) {
            return NextResponse.json(
                { error: 'Super admin already exists' },
                { status: 409 }
            )
        }

        const body = await request.json()
        const { email, password, fullName } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            )
        }

        console.log('Creating super admin with email:', email)

        const result = await createInitialSuperAdmin(email, password, fullName)

        if (!result.success) {
            console.error('Super admin creation failed:', result.error)
            return NextResponse.json(
                { error: result.error || 'Failed to create super admin' },
                { status: 500 }
            )
        }

        console.log('Super admin created successfully')

        return NextResponse.json({
            success: true,
            message: result.message
        })

    } catch (error) {
        console.error('Setup API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
