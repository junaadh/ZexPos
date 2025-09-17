import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserType, Restaurant } from "@/lib/types";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/components/dashboard-stats";

interface DashboardPageProps {
  searchParams: Promise<{ restaurant?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const { supabase, user } = await getCurrentUser();

  const userRole = user.role;
  const fullName = user.full_name;
  const userRestaurantId = user.restaurant_id;
  const userOrganizationId = user.organization_id;

  // Redirect to login if role is missing
  if (!userRole) {
    redirect("/auth/login?error=invalid_role");
  }

  let restaurantInfo: Restaurant | null = null;
  let organizationName: string | null = null;

  // For super admins - redirect to admin dashboard
  if (userRole === "super_admin") {
    redirect("/admin");
  }

  // Check if a specific restaurant is requested via query parameter
  const requestedRestaurantId = resolvedSearchParams.restaurant;

  // For org admins - handle restaurant selection
  if (userRole === "org_admin") {
    console.log("User is org_admin, organization ID:", userOrganizationId, user);
    // Show organization-focused dashboard for org admins
    if (!userOrganizationId) {
      redirect("/auth/login?error=no_organization_access");
    }

    // Try to use requested restaurant if provided and accessible
    if (requestedRestaurantId) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*, organizations(name)")
        .eq("id", requestedRestaurantId)
        .eq("organization_id", userOrganizationId)
        .single();

      if (restaurant) {
        restaurantInfo = restaurant;
        organizationName = restaurant.organizations?.name;
      }
    }

    // Fallback to first restaurant in organization if no specific one requested or access denied
    if (!restaurantInfo) {
      // Fetch user's organization details to show in dashboard
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", userOrganizationId)
        .single();

      if (!orgData) {
        redirect("/auth/login?error=invalid_organization");
      }

      organizationName = orgData.name;

      // Get a default restaurant for display purposes (first one in the org)
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("*, organizations(name)")
        .eq("organization_id", userOrganizationId)
        .limit(1);

      if (restaurants && restaurants.length > 0) {
        restaurantInfo = restaurants[0];
      }
    }
  } else if (userRestaurantId) {
    // For regular staff - only allow access to their assigned restaurant
    if (requestedRestaurantId && requestedRestaurantId !== userRestaurantId) {
      redirect("/auth/login?error=unauthorized_restaurant_access");
    }

    // Fetch their assigned restaurant
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*, organizations(name)")
      .eq("id", userRestaurantId)
      .single();

    if (!restaurant) {
      redirect("/auth/login?error=invalid_restaurant");
    }

    restaurantInfo = restaurant;
    organizationName = restaurant.organizations?.name;
  } else {
    // Regular users without a restaurant assignment should contact admin
    redirect("/auth/login?error=no_restaurant_access");
  }

  return (
    <div className="flex w-screen h-screen">
      <AppSidebar user={user} restaurant={restaurantInfo as Restaurant} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Dashboard Overview
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {fullName}!{" "}
                {userRole === "org_admin"
                  ? `Managing ${organizationName}`
                  : restaurantInfo?.name && `Working at ${restaurantInfo.name}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {userRole.replace("_", " ")}
              </Badge>
              {organizationName && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {organizationName}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-green-600 border-green-200"
              >
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                Live
              </Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <DashboardStats userRole={userRole} restaurantId={restaurantInfo?.id} />
        </div>
      </main>
    </div>
  );
}
