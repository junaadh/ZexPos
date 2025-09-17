// =============================================================================
// ORDERS API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
    getOrders,
    createOrder,
    createOrderWithItems,
    updateOrderStatus,
    getOrder
} from '@/lib/database'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const orderId = searchParams.get('id')

    if (!restaurantId && !orderId) {
        return NextResponse.json(
            { error: 'Restaurant ID or Order ID is required' },
            { status: 400 }
        )
    }

    try {
        if (orderId) {
            const result = await getOrder(orderId)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data)
        } else {
            const filters = {
                status: searchParams.get('status') || undefined,
                tableId: searchParams.get('tableId') || undefined,
                dateFrom: searchParams.get('dateFrom') || undefined,
                dateTo: searchParams.get('dateTo') || undefined,
            }

            const result = await getOrders(restaurantId!, filters)

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
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { items, ...orderData } = body

        // If items are provided, create order with items
        if (items && items.length > 0) {
            const result = await createOrderWithItems(orderData, items)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data, { status: 201 })
        } else {
            // Create order without items (legacy support)
            const result = await createOrder(orderData)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data, { status: 201 })
        }
    } catch (error) {
        console.error('Error creating order:', error)
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
                { error: 'Order ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { status } = body

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            )
        }

        const result = await updateOrderStatus(id, status)

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
