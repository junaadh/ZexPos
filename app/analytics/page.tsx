import AnalyticsComponent from "@/components/analytics";
import { Restaurant } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

interface AnalyticsPageProps {
  searchParams: { restaurant?: string };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { supabase, user } = await getCurrentUser();

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
    } else if (userRole === "super_admin") {
      // Super admin can access any restaurant
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", requestedRestaurantId)
        .single();

      if (restaurant) {
        restaurantInfo = restaurant;
        restaurantId = restaurant.id;
      }
    } else if (userRestaurantId === requestedRestaurantId) {
      // Regular staff can only access their assigned restaurant
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
        return <AnalyticsComponent user={user} restaurant={null} />;
      }
    } else if (userRole === "super_admin") {
      // For super admin, don't auto-select a restaurant - they should choose explicitly
      if (!requestedRestaurantId) {
        return <AnalyticsComponent user={user} restaurant={null} />;
      }
    } else if (userRestaurantId) {
      // For regular staff, use their assigned restaurant
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

  if (!restaurantId) {
    redirect("/restaurants/add");
  }

  return <AnalyticsComponent user={user} restaurant={restaurantInfo} />;
}
