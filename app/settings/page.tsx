import SettingsComponent from "@/components/settings";
import { Restaurant } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

interface SettingsPageProps {
  searchParams?: {
    restaurant?: string;
  };
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { supabase, user } = await getCurrentUser();

  const userRole = user.role;
  const userRestaurantId = user.restaurant_id;
  const queryRestaurantId = searchParams?.restaurant;

  let restaurantInfo: Restaurant | null = null;
  let restaurantId = userRestaurantId;

  // Use query parameter restaurant ID if provided and user has access
  if (queryRestaurantId && ['super_admin', 'org_admin', 'manager'].includes(userRole)) {
    // Validate that user has access to this restaurant
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", queryRestaurantId)
      .single();

    if (!error && restaurant) {
      // For org_admin, check if restaurant belongs to their organization
      if (userRole === 'org_admin' && restaurant.organization_id !== user.organization_id) {
        redirect("/settings");
      }
      restaurantInfo = restaurant;
      restaurantId = restaurant.id;
    }
  } else if (userRole === "super_admin" || userRole === "org_admin") {
    // For admins, don't auto-select a restaurant - they should choose explicitly
    // Only proceed if a specific restaurant is requested via URL parameter
    if (!queryRestaurantId) {
      // Render the settings component without restaurant data - it will show a restaurant selector
      return <SettingsComponent user={user} restaurant={null} />;
    }
  } else if (userRestaurantId) {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", userRestaurantId)
      .single();
    restaurantInfo = restaurant;
  }

  return <SettingsComponent user={user} restaurant={restaurantInfo} />;
}
