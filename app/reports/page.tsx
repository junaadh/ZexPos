import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { EndOfDayReport } from "@/components/end-of-day-report"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile and restaurant info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Construct UserType object
  const userObj = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || profile?.full_name || '',
    role: user.user_metadata?.role || profile?.role || 'server',
    organization_id: user.user_metadata?.organization_id || profile?.organization_id,
    restaurant_id: user.user_metadata?.restaurant_id || profile?.restaurant_id,
    phone: profile?.phone,
    is_active: profile?.is_active,
    permissions: profile?.permissions,
    hire_date: profile?.hire_date,
    hourly_rate: profile?.hourly_rate,
    created_at: profile?.created_at,
    updated_at: profile?.updated_at
  }

  let restaurant = null
  if (profile?.default_restaurant_id) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', profile.default_restaurant_id)
      .single()

    restaurant = data
  }

  return (
    <SidebarProvider>
      <AppSidebar user={userObj} restaurant={restaurant} />
      <SidebarInset>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <EndOfDayReport user={userObj} restaurant={restaurant} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
