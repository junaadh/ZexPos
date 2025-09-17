import { redirect } from "next/navigation"
import { AddRestaurant } from "@/components/add-restaurant"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUserWithRole } from "@/lib/auth"

export default async function AddRestaurantPage() {
    const { user } = await getCurrentUserWithRole(["super_admin", "org_admin"]);

    const userRole = user.role || "server"

    // Check if user can add restaurants
    if (!["super_admin", "org_admin"].includes(userRole)) {
        redirect("/restaurants")
    }

    return (
        <SidebarProvider>
            <AddRestaurant user={user} restaurant={null} />
        </SidebarProvider>
    )
}
