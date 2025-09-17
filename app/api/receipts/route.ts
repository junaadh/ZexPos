// =============================================================================
// RECEIPTS API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
    createReceipt,
    getReceipt,
    getReceiptByOrder,
    getReceiptsByRestaurant,
    getOrder,
    getRestaurant
} from '@/lib/database'
import { generateReceiptNumber, generateReceiptData } from '@/lib/receipt-utils'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const receiptId = searchParams.get('id')
    const orderId = searchParams.get('orderId')
    const restaurantId = searchParams.get('restaurantId')

    // Add authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        )
    }

    try {
        if (receiptId) {
            // Get specific receipt
            const result = await getReceipt(receiptId)

            if (result.error) {
                console.error('Receipt API Error:', result.error)
                return NextResponse.json(
                    { error: result.error },
                    { status: 404 }
                )
            }

            if (!result.data) {
                return NextResponse.json(
                    { error: 'Receipt not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(result.data)
        } else if (orderId) {
            // Get receipt by order ID
            const result = await getReceiptByOrder(orderId)

            if (result.error) {
                console.error('Receipt by Order API Error:', result.error)
                return NextResponse.json(
                    { error: result.error },
                    { status: 404 }
                )
            }

            if (!result.data) {
                return NextResponse.json(
                    { error: 'No receipt found for this order' },
                    { status: 404 }
                )
            }

            return NextResponse.json(result.data)
        } else if (restaurantId) {
            // Get receipts for restaurant
            const filters = {
                dateFrom: searchParams.get('dateFrom') || undefined,
                dateTo: searchParams.get('dateTo') || undefined,
                receiptType: searchParams.get('receiptType') || undefined,
            }

            const result = await getReceiptsByRestaurant(restaurantId, filters)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data)
        } else {
            return NextResponse.json(
                { error: 'Receipt ID, Order ID, or Restaurant ID is required' },
                { status: 400 }
            )
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch receipt data' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, paymentDetails } = body

        if (!orderId || !paymentDetails) {
            return NextResponse.json(
                { error: 'Order ID and payment details are required' },
                { status: 400 }
            )
        }

        // Get authenticated user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get the order with all related data
        const orderResult = await getOrder(orderId)
        if (orderResult.error || !orderResult.data) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        const order = orderResult.data

        // Get restaurant details
        const restaurantResult = await getRestaurant(order.restaurant_id)
        if (restaurantResult.error || !restaurantResult.data) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            )
        }

        const restaurant = restaurantResult.data

        // Generate receipt data
        const receiptData = generateReceiptData(order, restaurant, paymentDetails)

        // Create receipt record
        const receipt = {
            order_id: orderId,
            restaurant_id: order.restaurant_id,
            receipt_number: generateReceiptNumber(),
            generated_at: new Date().toISOString(),
            generated_by: user.id,
            receipt_type: 'payment' as const,
            receipt_data: receiptData,
        }

        const result = await createReceipt(receipt)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data, { status: 201 })
    } catch (error) {
        console.error('Error generating receipt:', error)
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}
