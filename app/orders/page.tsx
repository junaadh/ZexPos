import OrdersComponent from "@/components/order";
import { Restaurant } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurant?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { supabase, user } = await getCurrentUser();
  const userRole = user.role;
  const userRestaurantId = user.restaurant_id;

  let restaurantInfo: Restaurant | null = null;
  let restaurantId = userRestaurantId;

  // Check if a specific restaurant is requested via query parameter
  const requestedRestaurantId = resolvedSearchParams.restaurant;

  if (requestedRestaurantId) {
    // Verify user has access to this restaurant
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", requestedRestaurantId)
      .eq("organization_id", user.organization_id)
      .single();

    if (restaurant) {
      restaurantInfo = restaurant;
      restaurantId = restaurant.id;
    } else {
      // Restaurant not found or user doesn't have access, fall back to default logic
    }
  }

  // If no specific restaurant requested or not accessible, use default logic
  if (!restaurantInfo) {
    if (userRole === "super_admin" || userRole === "org_admin") {
      // For admins, don't auto-select a restaurant - they should choose explicitly
      // Only proceed if a specific restaurant is requested via URL parameter
      if (!requestedRestaurantId) {
        // Render the orders component without restaurant data - it will show a restaurant selector
        return <OrdersComponent user={user} restaurant={null} />;
      }
    } else if (userRestaurantId) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", userRestaurantId)
        .single();
      restaurantInfo = restaurant;
    } else {
      // If no restaurant_id, try to get from organization
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("*")
        .eq("organization_id", user.organization_id)
        .limit(1);

      if (restaurants && restaurants.length > 0) {
        restaurantInfo = restaurants[0];
        restaurantId = restaurants[0].id;
      }
    }
  }

  // For non-admin users, restaurant is required
  if (!restaurantId && !restaurantInfo && (userRole !== "super_admin" && userRole !== "org_admin")) {
    redirect("/restaurants/add");
  }

  return <OrdersComponent user={user} restaurant={restaurantInfo} />;
}
