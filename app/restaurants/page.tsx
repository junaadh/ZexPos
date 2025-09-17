import { redirect } from "next/navigation"
import { RestaurantManagement } from "@/components/restaurant-management"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUserWithRole } from "@/lib/auth"

export default async function RestaurantsPage() {
    const { user } = await getCurrentUserWithRole(["super_admin", "org_admin", "manager"]);

    const userRole = user.role;

    return (
        <SidebarProvider>
            <RestaurantManagement
                user={user}
                restaurant={null}
            />
        </SidebarProvider>
    )
}
