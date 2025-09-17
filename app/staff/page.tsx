import StaffManagement from "@/components/staff";
import { Restaurant } from "@/lib/types";
import { getCurrentUserWithRole } from "@/lib/auth";
import { redirect } from "next/navigation";

interface StaffPageProps {
  searchParams: { restaurant?: string };
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { user } = await getCurrentUserWithRole(['org_admin', 'manager']);

  if (!user) {
    redirect('/auth/login');
  }

  const { supabase } = await getCurrentUserWithRole(['org_admin', 'manager']);
  const userRole = user.role;
  const userRestaurantId = user.restaurant_id;
  const userOrganizationId = user.organization_id;

  // Check if a specific restaurant is requested via query parameter
  const requestedRestaurantId = searchParams.restaurant;

  let restaurantInfo: Restaurant | null = null;
  let restaurantId = userRestaurantId;

  if (requestedRestaurantId) {
    // Validate access to the requested restaurant
    if (userRole === "org_admin" && userOrganizationId) {
      // Org admin can access restaurants in their organization
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", requestedRestaurantId)
        .eq("organization_id", userOrganizationId)
        .single();

      if (restaurant) {
        restaurantInfo = restaurant;
        restaurantId = restaurant.id;
      }
    } else if (userRestaurantId === requestedRestaurantId) {
      // Managers can only access their assigned restaurant
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", requestedRestaurantId)
        .single();

      if (restaurant) {
        restaurantInfo = restaurant;
        restaurantId = restaurant.id;
      }
    }
  }

  // Fallback logic if no specific restaurant requested or access denied
  if (!restaurantInfo) {
    if (userRole === "org_admin" && userOrganizationId) {
      // For org admin, don't auto-select a restaurant - they should choose explicitly
      if (!requestedRestaurantId) {
        return <StaffManagement user={user} restaurant={null} />;
      }
    } else if (userRestaurantId) {
      // For managers, use their assigned restaurant
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", userRestaurantId)
        .single();

      if (restaurant) {
        restaurantInfo = restaurant;
        restaurantId = restaurant.id;
      }
    }
  }

  // For org admins without restaurants, they can still manage organization staff
  if (!restaurantId && userRole === "org_admin") {
    return <StaffManagement user={user} restaurant={null} />;
  }

  if (!restaurantId) {
    redirect("/restaurants/add");
  }

  return <StaffManagement user={user} restaurant={restaurantInfo} />;
}
