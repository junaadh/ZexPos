// =============================================================================
// MENU API ROUTES
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuCategories,
    createMenuCategory
} from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type') // 'items' or 'categories'

    if (!restaurantId) {
        return NextResponse.json(
            { error: 'Restaurant ID is required' },
            { status: 400 }
        )
    }

    try {
        if (type === 'categories') {
            const result = await getMenuCategories(restaurantId)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data)
        } else {
            const result = await getMenuItems(restaurantId, categoryId || undefined)

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
            { error: 'Failed to fetch menu data' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication and permissions
        const { user } = await getCurrentUser()

        console.log("MENU ROUTE - POST - USER:", user);

        // Only managers and admins can create menu items/categories
        if (!['super_admin', 'org_admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions to create menu items' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'item' or 'category'

        const body = await request.json()

        console.log("MENU ROUTE - POST - Request body:", body);
        console.log("MENU ROUTE - POST - Restaurant ID:", body.restaurant_id);
        console.log("MENU ROUTE - POST - Type:", type);

        if (type === 'category') {
            const result = await createMenuCategory(body)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data, { status: 201 })
        } else {
            const result = await createMenuItem(body)

            if (result.error) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                )
            }

            return NextResponse.json(result.data, { status: 201 })
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const { user } = await getCurrentUser()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()

        // Check if this is an availability-only update
        const isAvailabilityOnlyUpdate = Object.keys(body).length === 1 && 'is_available' in body

        // Staff can only update availability, managers can update everything
        if (!isAvailabilityOnlyUpdate && !['super_admin', 'org_admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions to fully edit menu items. Staff can only toggle availability.' },
                { status: 403 }
            )
        }

        const result = await updateMenuItem(id, body)

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

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication and permissions
        const { user } = await getCurrentUser()

        // Only managers and admins can delete menu items
        if (!['super_admin', 'org_admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions to delete menu items' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            )
        }

        const result = await deleteMenuItem(id)

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete menu item' },
            { status: 500 }
        )
    }
}
