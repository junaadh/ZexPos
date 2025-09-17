import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { OrderEditComponent } from "@/components/order-edit"
import type { Order, MenuItem, MenuCategory } from "@/lib/types"

interface OrderEditPageProps {
    params: Promise<{ id: string }>
}

export default async function OrderEditPage({ params }: OrderEditPageProps) {
    const { supabase, user } = await getCurrentUser()
    const { id } = await params

    // Fetch order with validation
    const { data: order, error } = await supabase
        .from("orders")
        .select(`
      *,
      restaurants (
        id,
        name,
        organization_id
      ),
      order_items (
        *,
        menu_items (
          id,
          name,
          price,
          category_id
        )
      )
    `)
        .eq("id", id)
        .single()

    if (error || !order) {
        redirect("/orders")
    }

    // Check permissions
    const canEdit =
        user.role === 'super_admin' ||
        (user.role === 'org_admin' && order.restaurants?.organization_id === user.organization_id) ||
        (user.restaurant_id === order.restaurant_id)

    if (!canEdit) {
        redirect("/orders")
    }

    // Only allow editing pending and confirmed orders
    if (order.status === 'completed' || order.status === 'cancelled') {
        redirect("/orders")
    }

    // Fetch menu items and categories for the restaurant
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', order.restaurant_id)

    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', order.restaurant_id)

    return (
        <OrderEditComponent
            user={user}
            order={order}
            menuItems={menuItems || []}
            categories={categories || []}
        />
    )
}
