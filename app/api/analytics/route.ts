// =============================================================================
// ANALYTICS API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const timeRange = searchParams.get('timeRange') || '7d'

    if (!restaurantId) {
        return NextResponse.json(
            { error: 'Restaurant ID is required' },
            { status: 400 }
        )
    }

    try {
        const supabase = await createClient()

        // Calculate date range
        const now = new Date()
        let dateFrom: Date

        switch (timeRange) {
            case '1d':
                dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                break
            case '30d':
                dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case '90d':
                dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            case '7d':
            default:
                dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
        }

        // Get orders data
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .gte('created_at', dateFrom.toISOString())
            .lte('created_at', now.toISOString())

        if (ordersError) {
            return NextResponse.json(
                { error: ordersError.message },
                { status: 500 }
            )
        }

        // Calculate basic metrics
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const totalOrders = orders?.length || 0
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Generate sales data by day
        const salesByDay = new Map()
        orders?.forEach(order => {
            const date = new Date(order.created_at).toDateString()
            if (!salesByDay.has(date)) {
                salesByDay.set(date, { revenue: 0, orders: 0 })
            }
            const day = salesByDay.get(date)
            day.revenue += order.total_amount || 0
            day.orders += 1
        })

        const salesData = Array.from(salesByDay.entries()).map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: data.revenue,
            orders: data.orders,
            avgOrder: data.orders > 0 ? data.revenue / data.orders : 0
        }))

        // Generate hourly data
        const hourlyData = Array.from({ length: 14 }, (_, i) => {
            const hour = i + 9 // Start from 9 AM
            const hourString = hour <= 12 ? `${hour}AM` : `${hour - 12}PM`
            const hourOrders = orders?.filter(order => {
                const orderHour = new Date(order.created_at).getHours()
                return orderHour === hour
            }) || []

            return {
                hour: hourString,
                orders: hourOrders.length,
                revenue: hourOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
            }
        })

        // Get popular items (if order_items table exists)
        let popularItems: any[] = []
        try {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    total_price,
                    menu_items (
                        name
                    )
                `)
                .in('order_id', orders?.map(o => o.id) || [])

            if (orderItems) {
                const itemStats = new Map()
                orderItems.forEach((item: any) => {
                    const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items
                    const name = menuItem?.name || 'Unknown Item'
                    if (!itemStats.has(name)) {
                        itemStats.set(name, { orders: 0, revenue: 0 })
                    }
                    const stats = itemStats.get(name)
                    stats.orders += item.quantity || 0
                    stats.revenue += item.total_price || 0
                })

                popularItems = Array.from(itemStats.entries())
                    .map(([name, stats]) => ({
                        name,
                        orders: stats.orders,
                        revenue: stats.revenue,
                        percentage: totalOrders > 0 ? (stats.orders / totalOrders) * 100 : 0
                    }))
                    .sort((a, b) => b.orders - a.orders)
                    .slice(0, 5)
            }
        } catch (error) {
            console.log('Could not fetch order items data:', error)
        }

        // Generate category data (simplified)
        const categoryData = [
            { name: "Food", value: Math.round(totalOrders * 0.7), revenue: Math.round(totalRevenue * 0.8) },
            { name: "Beverages", value: Math.round(totalOrders * 0.2), revenue: Math.round(totalRevenue * 0.15) },
            { name: "Desserts", value: Math.round(totalOrders * 0.1), revenue: Math.round(totalRevenue * 0.05) },
        ]

        // Get staff performance (if staff table exists)
        let staffPerformance: any[] = []
        try {
            const { data: staff } = await supabase
                .from('staff')
                .select('id, full_name')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true)

            if (staff) {
                staffPerformance = await Promise.all(
                    staff.map(async (member) => {
                        const staffOrders = orders?.filter(order => order.server_id === member.id) || []
                        const staffRevenue = staffOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

                        return {
                            name: member.full_name || 'Unknown',
                            orders: staffOrders.length,
                            revenue: staffRevenue,
                            avgTime: 20 + Math.random() * 10, // Mock data for now
                            rating: 4.2 + Math.random() * 0.6 // Mock data for now
                        }
                    })
                )
            }
        } catch (error) {
            console.log('Could not fetch staff data:', error)
        }

        return NextResponse.json({
            salesData,
            hourlyData,
            popularItems,
            categoryData,
            staffPerformance,
            totalRevenue,
            totalOrders,
            avgOrderValue
        })

    } catch (error) {
        console.error('Analytics API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
