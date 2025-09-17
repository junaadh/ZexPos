// =============================================================================
// ZEX-POS DATABASE HANDLERS
// =============================================================================
// Comprehensive handlers for all database operations

import { createClient } from '@/lib/supabase/server'
import type {
    Restaurant,
    MenuItem,
    MenuCategory,
    Order,
    OrderItem,
    RestaurantTable,
    Staff,
    Customer,
    InventoryItem,
    DailySales,
    Receipt,
    ReceiptTemplate,
    ApiResponse,
    PaginatedResponse,
} from '@/lib/types'

// =============================================================================
// RESTAURANT HANDLERS
// =============================================================================

export async function getRestaurants(): Promise<ApiResponse<Restaurant[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching restaurants:', error)
        return { error: 'Failed to fetch restaurants' }
    }
}

export async function getRestaurant(id: string): Promise<ApiResponse<Restaurant>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error fetching restaurant:', error)
        return { error: 'Failed to fetch restaurant' }
    }
}

export async function createRestaurant(restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Restaurant>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurants')
            .insert(restaurant)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating restaurant:', error)
        return { error: 'Failed to create restaurant' }
    }
}

export async function updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurants')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error updating restaurant:', error)
        return { error: 'Failed to update restaurant' }
    }
}

// =============================================================================
// MENU HANDLERS
// =============================================================================

export async function getMenuCategories(restaurantId: string): Promise<ApiResponse<MenuCategory[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching menu categories:', error)
        return { error: 'Failed to fetch menu categories' }
    }
}

export async function createMenuCategory(category: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<MenuCategory>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('menu_categories')
            .insert(category)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating menu category:', error)
        return { error: 'Failed to create menu category' }
    }
}

export async function getMenuItems(restaurantId: string, categoryId?: string): Promise<ApiResponse<MenuItem[]>> {
    try {
        const supabase = await createClient()
        let query = supabase
            .from('menu_items')
            .select(`
        *,
        menu_categories!inner (
          id,
          name
        )
      `)
            .eq('restaurant_id', restaurantId)
            .order('sort_order', { ascending: true })

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching menu items:', error)
        return { error: 'Failed to fetch menu items' }
    }
}

export async function getMenuItem(id: string): Promise<ApiResponse<MenuItem>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('menu_items')
            .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error fetching menu item:', error)
        return { error: 'Failed to fetch menu item' }
    }
}

export async function createMenuItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<MenuItem>> {
    try {
        const supabase = await createClient()

        // If no image_url provided, use placeholder
        const itemData = {
            ...item,
            image_url: item.image_url || '/placeholder.jpg'
        }

        const { data, error } = await supabase
            .from('menu_items')
            .insert(itemData)
            .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating menu item:', error)
        return { error: 'Failed to create menu item' }
    }
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('menu_items')
            .update(updates)
            .eq('id', id)
            .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error updating menu item:', error)
        return { error: 'Failed to update menu item' }
    }
}

export async function deleteMenuItem(id: string): Promise<ApiResponse<boolean>> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { data: true }
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return { error: 'Failed to delete menu item' }
    }
}

// =============================================================================
// ORDER HANDLERS
// =============================================================================

export async function getOrders(
    restaurantId: string,
    filters?: {
        status?: string;
        tableId?: string;
        dateFrom?: string;
        dateTo?: string;
    }
): Promise<ApiResponse<Order[]>> {
    try {
        const supabase = await createClient()
        let query = supabase
            .from('orders')
            .select(`
        *,
        restaurant_tables (
          id,
          table_number,
          table_name
        ),
        staff (
          id,
          full_name
        ),
        order_items (
          *,
          menu_items (
            name,
            price
          )
        )
      `)
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }
        if (filters?.tableId) {
            query = query.eq('table_id', filters.tableId)
        }
        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom)
        }
        if (filters?.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching orders:', error)
        return { error: 'Failed to fetch orders' }
    }
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        restaurant_tables (
          id,
          table_number,
          table_name
        ),
        staff (
          id,
          full_name
        ),
        order_items (
          *,
          menu_items (
            name,
            price,
            image_url
          )
        )
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error fetching order:', error)
        return { error: 'Failed to fetch order' }
    }
}

export async function createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Order>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating order:', error)
        return { error: 'Failed to create order' }
    }
}

export async function createOrderItems(orderItems: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<OrderItem[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('order_items')
            .insert(orderItems)
            .select()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating order items:', error)
        return { error: 'Failed to create order items' }
    }
}

export async function createOrderWithItems(
    orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>,
    items: Array<{
        menu_item_id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        special_instructions?: string;
    }>
): Promise<ApiResponse<Order>> {
    try {
        const supabase = await createClient()

        // Start a transaction by creating the order first
        // The order_number will be automatically generated by the trigger
        const { data: orderResult, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = items.map(item => ({
            order_id: orderResult.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            special_instructions: item.special_instructions || null,
            status: 'pending' as const
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) {
            // If order items fail, we should delete the order to maintain consistency
            await supabase.from('orders').delete().eq('id', orderResult.id)
            throw itemsError
        }

        return { data: orderResult }
    } catch (error) {
        console.error('Error creating order with items:', error)
        return { error: 'Failed to create order with items' }
    }
}

export async function updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error updating order status:', error)
        return { error: 'Failed to update order status' }
    }
}

// =============================================================================
// TABLE HANDLERS
// =============================================================================

export async function getRestaurantTables(restaurantId: string): Promise<ApiResponse<RestaurantTable[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('table_number', { ascending: true })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching restaurant tables:', error)
        return { error: 'Failed to fetch restaurant tables' }
    }
}

export async function createRestaurantTable(table: Omit<RestaurantTable, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<RestaurantTable>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurant_tables')
            .insert(table)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating restaurant table:', error)
        return { error: 'Failed to create restaurant table' }
    }
}

export async function updateTableStatus(id: string, status: string): Promise<ApiResponse<RestaurantTable>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurant_tables')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error updating table status:', error)
        return { error: 'Failed to update table status' }
    }
}

export async function updateRestaurantTable(id: string, updates: Partial<Omit<RestaurantTable, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<RestaurantTable>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('restaurant_tables')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error updating table:', error)
        return { error: 'Failed to update table' }
    }
}

export async function deleteRestaurantTable(id: string): Promise<ApiResponse<void>> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('restaurant_tables')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { data: undefined }
    } catch (error) {
        console.error('Error deleting table:', error)
        return { error: 'Failed to delete table' }
    }
}

// =============================================================================
// STAFF HANDLERS
// =============================================================================

export async function getStaff(restaurantId: string): Promise<ApiResponse<Staff[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching staff:', error)
        return { error: 'Failed to fetch staff' }
    }
}

export async function createStaff(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Staff>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('staff')
            .insert(staff)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating staff:', error)
        return { error: 'Failed to create staff' }
    }
}

// =============================================================================
// ANALYTICS HANDLERS
// =============================================================================

export async function getDailySales(
    restaurantId: string,
    dateFrom: string,
    dateTo: string
): Promise<ApiResponse<DailySales[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('daily_sales')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .gte('date', dateFrom)
            .lte('date', dateTo)
            .order('date', { ascending: true })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching daily sales:', error)
        return { error: 'Failed to fetch daily sales' }
    }
}

export async function getPopularMenuItems(
    restaurantId: string,
    limit: number = 10
): Promise<ApiResponse<any[]>> {
    try {
        const supabase = await createClient()

        // Get order items with menu item details for the last 30 days
        const { data, error } = await supabase
            .from('order_items')
            .select(`
        quantity,
        total_price,
        menu_items!inner (
          id,
          name,
          image_url,
          restaurant_id
        ),
        orders!inner (
          created_at
        )
      `)
            .eq('menu_items.restaurant_id', restaurantId)
            .gte('orders.created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (error) throw error

        // Group by menu item and calculate totals
        const grouped = (data || []).reduce((acc: any, item: any) => {
            const menuItemId = item.menu_items.id
            if (!acc[menuItemId]) {
                acc[menuItemId] = {
                    id: menuItemId,
                    name: item.menu_items.name,
                    image_url: item.menu_items.image_url || '/placeholder.jpg',
                    total_quantity: 0,
                    total_revenue: 0
                }
            }
            acc[menuItemId].total_quantity += item.quantity
            acc[menuItemId].total_revenue += item.total_price
            return acc
        }, {})

        const result = Object.values(grouped)
            .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
            .slice(0, limit)

        return { data: result }
    } catch (error) {
        console.error('Error fetching popular menu items:', error)
        return { error: 'Failed to fetch popular menu items' }
    }
}

// =============================================================================
// CUSTOMER HANDLERS
// =============================================================================

export async function getCustomers(restaurantId: string): Promise<ApiResponse<Customer[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .order('total_spent', { ascending: false })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching customers:', error)
        return { error: 'Failed to fetch customers' }
    }
}

// =============================================================================
// INVENTORY HANDLERS
// =============================================================================

export async function getInventoryItems(restaurantId: string): Promise<ApiResponse<InventoryItem[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
        *,
        inventory_categories (
          id,
          name
        )
      `)
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching inventory items:', error)
        return { error: 'Failed to fetch inventory items' }
    }
}

export async function getLowStockItems(restaurantId: string): Promise<ApiResponse<InventoryItem[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
        *,
        inventory_categories (
          id,
          name
        )
      `)
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .filter('current_stock', 'lte', 'minimum_stock')
            .order('current_stock', { ascending: true })

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching low stock items:', error)
        return { error: 'Failed to fetch low stock items' }
    }
}

// =============================================================================
// RECEIPT HANDLERS
// =============================================================================

export async function createReceipt(receipt: Omit<Receipt, 'id' | 'created_at'>): Promise<ApiResponse<Receipt>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('receipts')
            .insert(receipt)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating receipt:', error)
        return { error: 'Failed to create receipt' }
    }
}

export async function getReceipt(id: string): Promise<ApiResponse<Receipt>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error fetching receipt:', error)
        return { error: 'Failed to fetch receipt' }
    }
}

export async function getReceiptByOrder(orderId: string): Promise<ApiResponse<Receipt>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error fetching receipt by order:', error)
        return { error: 'Failed to fetch receipt' }
    }
}

export async function getReceiptsByRestaurant(
    restaurantId: string,
    filters?: {
        dateFrom?: string;
        dateTo?: string;
        receiptType?: string;
    }
): Promise<ApiResponse<Receipt[]>> {
    try {
        const supabase = await createClient()
        let query = supabase
            .from('receipts')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })

        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom)
        }
        if (filters?.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }
        if (filters?.receiptType) {
            query = query.eq('receipt_type', filters.receiptType)
        }

        const { data, error } = await query

        if (error) throw error
        return { data: data || [] }
    } catch (error) {
        console.error('Error fetching receipts:', error)
        return { error: 'Failed to fetch receipts' }
    }
}

export async function getReceiptTemplate(restaurantId: string): Promise<ApiResponse<ReceiptTemplate>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('receipt_templates')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_default', true)
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error fetching receipt template:', error)
        return { error: 'Failed to fetch receipt template' }
    }
}

export async function createReceiptTemplate(template: Omit<ReceiptTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ReceiptTemplate>> {
    try {
        const supabase = await createClient()

        // If this is set as default, unset other defaults first
        if (template.is_default) {
            await supabase
                .from('receipt_templates')
                .update({ is_default: false })
                .eq('restaurant_id', template.restaurant_id)
        }

        const { data, error } = await supabase
            .from('receipt_templates')
            .insert(template)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error creating receipt template:', error)
        return { error: 'Failed to create receipt template' }
    }
}

export async function updateReceiptTemplate(id: string, updates: Partial<ReceiptTemplate>): Promise<ApiResponse<ReceiptTemplate>> {
    try {
        const supabase = await createClient()

        // If this is being set as default, unset other defaults first
        if (updates.is_default && updates.restaurant_id) {
            await supabase
                .from('receipt_templates')
                .update({ is_default: false })
                .eq('restaurant_id', updates.restaurant_id)
                .neq('id', id)
        }

        const { data, error } = await supabase
            .from('receipt_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data }
    } catch (error) {
        console.error('Error updating receipt template:', error)
        return { error: 'Failed to update receipt template' }
    }
}