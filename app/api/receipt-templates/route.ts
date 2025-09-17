// =============================================================================
// RECEIPT TEMPLATES API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
    getReceiptTemplate,
    createReceiptTemplate,
    updateReceiptTemplate
} from '@/lib/database'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
        return NextResponse.json(
            { error: 'Restaurant ID is required' },
            { status: 400 }
        )
    }

    try {
        const result = await getReceiptTemplate(restaurantId)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch receipt template' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const result = await createReceiptTemplate(body)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Template ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const result = await updateReceiptTemplate(id, body)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data)
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}
