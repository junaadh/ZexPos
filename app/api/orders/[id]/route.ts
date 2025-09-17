import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { customer_name, customer_phone, kitchen_notes, table_number, order_items } = body

        // Update order basic info
        const { error: orderError } = await supabase
            .from('orders')
            .update({
                customer_name,
                customer_phone,
                kitchen_notes,
                table_number,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)

        if (orderError) {
            return NextResponse.json({ error: orderError.message }, { status: 400 })
        }

        // Delete existing order items and recreate them
        await supabase
            .from('order_items')
            .delete()
            .eq('order_id', params.id)

        // Insert new order items
        if (order_items && order_items.length > 0) {
            const itemsToInsert = order_items.map((item: any) => ({
                order_id: params.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                special_instructions: item.special_instructions || "",
                status: 'pending'
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert)

            if (itemsError) {
                return NextResponse.json({ error: itemsError.message }, { status: 400 })
            }
        }

        // Calculate new total
        const total = order_items.reduce((sum: number, item: any) => sum + item.total_price, 0)

        await supabase
            .from('orders')
            .update({ total_amount: total })
            .eq('id', params.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { action, additional_items } = body

        if (action === 'print_kitchen_ticket') {
            // Mark order as confirmed and return kitchen ticket data
            await supabase
                .from('orders')
                .update({ status: 'confirmed' })
                .eq('id', params.id)

            // Get order with items for kitchen ticket
            const { data: order } = await supabase
                .from('orders')
                .select(`
          *,
          order_items(*, menu_items(*)),
          restaurants(name)
        `)
                .eq('id', params.id)
                .single()

            return NextResponse.json({ order, ticket_type: 'kitchen' })
        }

        if (action === 'print_additional_items' && additional_items) {
            // Print additional items ticket
            const { data: order } = await supabase
                .from('orders')
                .select(`
          *,
          restaurants(name)
        `)
                .eq('id', params.id)
                .single()

            return NextResponse.json({
                order,
                additional_items,
                ticket_type: 'additional'
            })
        }

        if (action === 'complete') {
            // Mark order as completed
            await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', params.id)

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error) {
        console.error('Error processing order action:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
