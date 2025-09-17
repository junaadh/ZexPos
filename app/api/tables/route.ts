// =============================================================================
// TABLES API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
    getRestaurantTables,
    createRestaurantTable,
    updateTableStatus,
    updateRestaurantTable,
    deleteRestaurantTable
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

    const result = await getRestaurantTables(restaurantId)

    if (result.error) {
        return NextResponse.json(
            { error: result.error },
            { status: 500 }
        )
    }

    return NextResponse.json(result.data)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const result = await createRestaurantTable(body)

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
                { error: 'Table ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()

        // Check if this is a status-only update or a full table update
        if (body.status && Object.keys(body).length === 1) {
            // Status-only update
            const result = await updateTableStatus(id, body.status)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data)
        } else {
            // Full table update
            const result = await updateRestaurantTable(id, body)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data)
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Table ID is required' },
                { status: 400 }
            )
        }

        const result = await deleteRestaurantTable(id)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete table' },
            { status: 500 }
        )
    }
}
