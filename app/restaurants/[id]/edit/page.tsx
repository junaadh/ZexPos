import { notFound, redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { EditRestaurant } from "@/components/edit-restaurant"
import type { Restaurant } from "@/lib/types"
import { getCurrentUserWithRole } from "@/lib/auth"

interface EditRestaurantPageProps {
    params: Promise<{ id: string }>
}

export default async function EditRestaurantPage({ params }: EditRestaurantPageProps) {
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
        <EditRestaurant user={user} restaurant={restaurant} />
    )
}
