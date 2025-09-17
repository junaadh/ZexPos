import { redirect } from "next/navigation"
import { getCurrentUserWithRole } from "@/lib/auth"
import AdminDashboard from "@/components/admin-dashboard"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function AdminPage() {
    const { user } = await getCurrentUserWithRole(["super_admin"]);

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar
                    user={user}
                    restaurant={null}
                />
                <main className="flex-1 overflow-auto">
                    <div className="container mx-auto p-8 max-w-7xl">
                        <AdminDashboard user={user} />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
