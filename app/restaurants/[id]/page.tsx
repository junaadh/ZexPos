import { notFound, redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { RestaurantDetails } from "@/components/restaurant-details"
import type { Restaurant } from "@/lib/types"
import { getCurrentUserWithRole } from "@/lib/auth"

interface RestaurantPageProps {
    params: Promise<{ id: string }>
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
    const { supabase, user } = await getCurrentUserWithRole(["super_admin", "org_admin", "manager"]);

    const { id } = await params

    const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single()

    if (restaurantError || !restaurant) {
        console.error("Error fetching restaurant:", restaurantError)
        notFound()
    }

    return (
        <RestaurantDetails user={user} restaurant={restaurant} />
    )
}
