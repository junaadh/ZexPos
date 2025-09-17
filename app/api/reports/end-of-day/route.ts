import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const restaurantId = searchParams.get('restaurant_id')
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

        if (!restaurantId) {
            return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
        }

        // Get start and end of day
        const startOfDay = `${date}T00:00:00.000Z`
        const endOfDay = `${date}T23:59:59.999Z`

        // Get completed orders for the day
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
        id,
        total_amount,
        created_at,
        completed_at,
        customer_name,
        table_number,
        order_items(
          quantity,
          unit_price,
          total_price,
          menu_items(name, category_id)
        )
      `)
            .eq('restaurant_id', restaurantId)
            .eq('status', 'completed')
            .gte('completed_at', startOfDay)
            .lte('completed_at', endOfDay)
            .order('completed_at', { ascending: true })

        if (ordersError) {
            return NextResponse.json({ error: ordersError.message }, { status: 400 })
        }

        // Get categories for mapping
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .eq('restaurant_id', restaurantId)

        const categoryMap = categories?.reduce((acc: any, cat: any) => {
            acc[cat.id] = cat.name
            return acc
        }, {}) || {}

        // Get restaurant settings for GST and service charge
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('metadata')
            .eq('id', restaurantId)
            .single()

        const settings = restaurant?.metadata || {}
        const gstRate = parseFloat(settings.gst_rate || '0') / 100
        const serviceChargeRate = parseFloat(settings.service_charge_rate || '0') / 100

        // Calculate totals
        const subtotal = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const serviceCharge = subtotal * serviceChargeRate
        const gstAmount = (subtotal + serviceCharge) * gstRate
        const grandTotal = subtotal + serviceCharge + gstAmount

        // Group by categories
        const categoryTotals: Record<string, { total: number, count: number }> = {}
        const itemTotals: Record<string, { total: number, count: number }> = {}

        orders?.forEach(order => {
            order.order_items?.forEach((item: any) => {
                const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items
                const categoryName = categoryMap[menuItem?.category_id] || 'Uncategorized'
                const itemName = menuItem?.name || 'Unknown Item'

                // Category totals
                if (!categoryTotals[categoryName]) {
                    categoryTotals[categoryName] = { total: 0, count: 0 }
                }
                categoryTotals[categoryName].total += item.total_price || 0
                categoryTotals[categoryName].count += item.quantity || 0

                // Item totals
                if (!itemTotals[itemName]) {
                    itemTotals[itemName] = { total: 0, count: 0 }
                }
                itemTotals[itemName].total += item.total_price || 0
                itemTotals[itemName].count += item.quantity || 0
            })
        })

        // Payment method breakdown (assuming cash for now, can be extended)
        const paymentMethods = {
            cash: grandTotal,
            card: 0,
            digital: 0
        }

        const report = {
            date,
            restaurant_id: restaurantId,
            summary: {
                total_orders: orders?.length || 0,
                subtotal,
                service_charge: serviceCharge,
                gst_amount: gstAmount,
                grand_total: grandTotal,
                average_order_value: orders?.length ? grandTotal / orders.length : 0
            },
            orders: orders || [],
            category_breakdown: categoryTotals,
            item_breakdown: itemTotals,
            payment_methods: paymentMethods,
            settings: {
                gst_rate: settings.gst_rate || '0',
                service_charge_rate: settings.service_charge_rate || '0'
            }
        }

        return NextResponse.json(report)
    } catch (error) {
        console.error('Error generating end-of-day report:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
