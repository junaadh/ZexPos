// =============================================================================
// ORDER ITEMS API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
        return NextResponse.json(
            { error: 'Order ID is required' },
            { status: 400 }
        )
    }

    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                *,
                menu_items (
                    id,
                    name,
                    description,
                    price,
                    image_url
                )
            `)
            .eq('order_id', orderId)

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching order items:', error)
        return NextResponse.json(
            { error: 'Failed to fetch order items' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { order_id, menu_item_id, quantity, unit_price, total_price, special_instructions } = body

        if (!order_id || !menu_item_id || !quantity || !unit_price) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Insert new order item
        const { data: orderItem, error: orderItemError } = await supabase
            .from('order_items')
            .insert({
                order_id,
                menu_item_id,
                quantity,
                unit_price,
                total_price: total_price || (unit_price * quantity),
                special_instructions: special_instructions || null,
                status: 'pending'
            })
            .select()
            .single()

        if (orderItemError) throw orderItemError

        // Update order totals
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('total_price')
            .eq('order_id', order_id)

        if (orderItems) {
            const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0)
            const taxAmount = subtotal * 0.1 // 10% tax
            const totalAmount = subtotal + taxAmount

            await supabase
                .from('orders')
                .update({
                    subtotal,
                    tax_amount: taxAmount,
                    total_amount: totalAmount
                })
                .eq('id', order_id)
        }

        return NextResponse.json(orderItem, { status: 201 })
    } catch (error) {
        console.error('Error adding order item:', error)
        return NextResponse.json(
            { error: 'Failed to add order item' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const itemId = searchParams.get('id')

        if (!itemId) {
            return NextResponse.json(
                { error: 'Order item ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { quantity, special_instructions, status } = body

        const supabase = await createClient()

        // Get current order item to calculate new total
        const { data: currentItem } = await supabase
            .from('order_items')
            .select('order_id, unit_price')
            .eq('id', itemId)
            .single()

        if (!currentItem) {
            return NextResponse.json(
                { error: 'Order item not found' },
                { status: 404 }
            )
        }

        const updateData: any = {}
        if (quantity !== undefined) {
            updateData.quantity = quantity
            updateData.total_price = currentItem.unit_price * quantity
        }
        if (special_instructions !== undefined) {
            updateData.special_instructions = special_instructions
        }
        if (status !== undefined) {
            updateData.status = status
        }

        // Update order item
        const { data: updatedItem, error: updateError } = await supabase
            .from('order_items')
            .update(updateData)
            .eq('id', itemId)
            .select()
            .single()

        if (updateError) throw updateError

        // Update order totals if quantity changed
        if (quantity !== undefined) {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('total_price')
                .eq('order_id', currentItem.order_id)

            if (orderItems) {
                const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0)
                const taxAmount = subtotal * 0.1 // 10% tax
                const totalAmount = subtotal + taxAmount

                await supabase
                    .from('orders')
                    .update({
                        subtotal,
                        tax_amount: taxAmount,
                        total_amount: totalAmount
                    })
                    .eq('id', currentItem.order_id)
            }
        }

        return NextResponse.json(updatedItem)
    } catch (error) {
        console.error('Error updating order item:', error)
        return NextResponse.json(
            { error: 'Failed to update order item' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const itemId = searchParams.get('id')

        if (!itemId) {
            return NextResponse.json(
                { error: 'Order item ID is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get order ID before deleting
        const { data: orderItem } = await supabase
            .from('order_items')
            .select('order_id')
            .eq('id', itemId)
            .single()

        if (!orderItem) {
            return NextResponse.json(
                { error: 'Order item not found' },
                { status: 404 }
            )
        }

        // Delete order item
        const { error: deleteError } = await supabase
            .from('order_items')
            .delete()
            .eq('id', itemId)

        if (deleteError) throw deleteError

        // Update order totals
        const { data: remainingItems } = await supabase
            .from('order_items')
            .select('total_price')
            .eq('order_id', orderItem.order_id)

        if (remainingItems) {
            const subtotal = remainingItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0)
            const taxAmount = subtotal * 0.1 // 10% tax
            const totalAmount = subtotal + taxAmount

            await supabase
                .from('orders')
                .update({
                    subtotal,
                    tax_amount: taxAmount,
                    total_amount: totalAmount
                })
                .eq('id', orderItem.order_id)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting order item:', error)
        return NextResponse.json(
            { error: 'Failed to delete order item' },
            { status: 500 }
        )
    }
}
