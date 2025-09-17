import { getCurrentUserWithRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OrganizationSettings } from "@/components/organization-settings"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function OrganizationSettingsPage() {
    const { user } = await getCurrentUserWithRole(['org_admin'])

    if (!user) {
        redirect('/auth/login')
    }

    if (!user.organization_id) {
        redirect('/')
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar user={user} restaurant={null} />
                <main className="flex-1 overflow-auto">
                    <div className="flex-1 space-y-4 p-8 pt-6">
                        <div className="flex items-center justify-between space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
                        </div>
                        <OrganizationSettings user={user} />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
