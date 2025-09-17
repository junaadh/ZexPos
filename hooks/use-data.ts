// =============================================================================
// REACT HOOKS FOR DATA FETCHING
// =============================================================================
// Client-side hooks for all database operations

import { useState, useEffect } from 'react'
import type {
    Restaurant,
    MenuItem,
    MenuCategory,
    Order,
    RestaurantTable,
    Staff,
    Customer,
    InventoryItem,
    DailySales,
} from '@/lib/types'

// =============================================================================
// RESTAURANT HOOKS
// =============================================================================

export function useRestaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchRestaurants = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/restaurants')

            if (!response.ok) {
                throw new Error('Failed to fetch restaurants')
            }

            const data = await response.json()
            setRestaurants(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const createRestaurant = async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/restaurants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(restaurant),
            })

            if (!response.ok) {
                throw new Error('Failed to create restaurant')
            }

            const newRestaurant = await response.json()
            setRestaurants(prev => [newRestaurant, ...prev])
            return newRestaurant
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
        try {
            const response = await fetch(`/api/restaurants?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            })

            if (!response.ok) {
                throw new Error('Failed to update restaurant')
            }

            const updatedRestaurant = await response.json()
            setRestaurants(prev =>
                prev.map(r => r.id === id ? updatedRestaurant : r)
            )
            return updatedRestaurant
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        restaurants,
        loading,
        error,
        refetch: fetchRestaurants,
        createRestaurant,
        updateRestaurant,
    }
}

// =============================================================================
// MENU HOOKS
// =============================================================================

export function useMenuItems(restaurantId: string, categoryId?: string) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMenuItems = async () => {
        if (!restaurantId) return

        try {
            setLoading(true)
            const params = new URLSearchParams({
                restaurantId,
                type: 'items',
            })

            if (categoryId) {
                params.append('categoryId', categoryId)
            }

            const response = await fetch(`/api/menu?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch menu items')
            }

            const data = await response.json()
            setMenuItems(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMenuItems()
    }, [restaurantId, categoryId])

    const createMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/menu?type=item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(item),
            })

            if (!response.ok) {
                throw new Error('Failed to create menu item')
            }

            const newItem = await response.json()
            setMenuItems(prev => [...prev, newItem])
            return newItem
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
        try {
            const response = await fetch(`/api/menu?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            })

            if (!response.ok) {
                throw new Error('Failed to update menu item')
            }

            const updatedItem = await response.json()
            setMenuItems(prev =>
                prev.map(item => item.id === id ? updatedItem : item)
            )
            return updatedItem
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const deleteMenuItem = async (id: string) => {
        try {
            const response = await fetch(`/api/menu?id=${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete menu item')
            }

            setMenuItems(prev => prev.filter(item => item.id !== id))
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        menuItems,
        loading,
        error,
        refetch: fetchMenuItems,
        createMenuItem,
        updateMenuItem,
        deleteMenuItem,
    }
}

export function useMenuCategories(restaurantId: string) {
    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategories = async () => {
        if (!restaurantId) return

        try {
            setLoading(true)
            const response = await fetch(`/api/menu?restaurantId=${restaurantId}&type=categories`)

            if (!response.ok) {
                throw new Error('Failed to fetch menu categories')
            }

            const data = await response.json()
            setCategories(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [restaurantId])

    const createCategory = async (category: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/menu?type=category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(category),
            })

            if (!response.ok) {
                throw new Error('Failed to create menu category')
            }

            const newCategory = await response.json()
            setCategories(prev => [...prev, newCategory])
            return newCategory
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
        createCategory,
    }
}

// =============================================================================
// ORDER HOOKS
// =============================================================================

export function useOrders(restaurantId: string, filters?: {
    status?: string;
    tableId?: string;
    dateFrom?: string;
    dateTo?: string;
}) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = async () => {
        if (!restaurantId) return

        try {
            setLoading(true)
            const params = new URLSearchParams({ restaurantId })

            if (filters?.status) params.append('status', filters.status)
            if (filters?.tableId) params.append('tableId', filters.tableId)
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
            if (filters?.dateTo) params.append('dateTo', filters.dateTo)

            const response = await fetch(`/api/orders?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch orders')
            }

            const data = await response.json()
            setOrders(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [restaurantId, filters])

    const createOrder = async (order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
            })

            if (!response.ok) {
                throw new Error('Failed to create order')
            }

            const newOrder = await response.json()
            setOrders(prev => [newOrder, ...prev])
            return newOrder
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const updateOrderStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/orders?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            })

            if (!response.ok) {
                throw new Error('Failed to update order status')
            }

            const updatedOrder = await response.json()
            setOrders(prev =>
                prev.map(order => order.id === id ? updatedOrder : order)
            )
            return updatedOrder
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        orders,
        loading,
        error,
        refetch: fetchOrders,
        createOrder,
        updateOrderStatus,
    }
}

// =============================================================================
// TABLE HOOKS
// =============================================================================

export function useRestaurantTables(restaurantId: string) {
    const [tables, setTables] = useState<RestaurantTable[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTables = async () => {
        if (!restaurantId) return

        try {
            setLoading(true)
            const response = await fetch(`/api/tables?restaurantId=${restaurantId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch tables')
            }

            const data = await response.json()
            setTables(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTables()
    }, [restaurantId])

    const createTable = async (table: Omit<RestaurantTable, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(table),
            })

            if (!response.ok) {
                throw new Error('Failed to create table')
            }

            const newTable = await response.json()
            setTables(prev => [...prev, newTable])
            return newTable
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const updateTableStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/tables?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            })

            if (!response.ok) {
                throw new Error('Failed to update table status')
            }

            const updatedTable = await response.json()
            setTables(prev =>
                prev.map(table => table.id === id ? updatedTable : table)
            )
            return updatedTable
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        tables,
        loading,
        error,
        refetch: fetchTables,
        createTable,
        updateTableStatus,
    }
}

// =============================================================================
// STAFF HOOKS
// =============================================================================

export function useStaff(restaurantId: string) {
    const [staff, setStaff] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStaff = async () => {
        if (!restaurantId) return

        try {
            setLoading(true)
            const response = await fetch(`/api/staff?restaurantId=${restaurantId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch staff')
            }

            const data = await response.json()
            setStaff(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [restaurantId])

    const createStaff = async (staffMember: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(staffMember),
            })

            if (!response.ok) {
                throw new Error('Failed to create staff member')
            }

            const newStaff = await response.json()
            setStaff(prev => [...prev, newStaff])
            return newStaff
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        staff,
        loading,
        error,
        refetch: fetchStaff,
        createStaff,
    }
}

// =============================================================================
// ANALYTICS HOOKS
// =============================================================================

export function useAnalytics(restaurantId: string) {
    const [salesData, setSalesData] = useState<DailySales[]>([])
    const [popularItems, setPopularItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSalesData = async (dateFrom: string, dateTo: string) => {
        if (!restaurantId) return

        try {
            setLoading(true)
            const response = await fetch(
                `/api/analytics?restaurantId=${restaurantId}&type=sales&dateFrom=${dateFrom}&dateTo=${dateTo}`
            )

            if (!response.ok) {
                throw new Error('Failed to fetch sales data')
            }

            const data = await response.json()
            setSalesData(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const fetchPopularItems = async (limit: number = 10) => {
        if (!restaurantId) return

        try {
            const response = await fetch(
                `/api/analytics?restaurantId=${restaurantId}&type=popular-items&limit=${limit}`
            )

            if (!response.ok) {
                throw new Error('Failed to fetch popular items')
            }

            const data = await response.json()
            setPopularItems(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    return {
        salesData,
        popularItems,
        loading,
        error,
        fetchSalesData,
        fetchPopularItems,
    }
}
