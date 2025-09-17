import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TableManagement } from "@/components/table-management";
import type { User, Restaurant } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

interface TablesPageProps {
  searchParams: { restaurant?: string };
}

export default async function TablesPage({ searchParams }: TablesPageProps) {
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
        return <TableManagement user={user} restaurant={null} initialTables={[]} />;
      }
    } else if (userRole === "super_admin") {
      // For super admin, don't auto-select a restaurant - they should choose explicitly
      if (!requestedRestaurantId) {
        return <TableManagement user={user} restaurant={null} initialTables={[]} />;
      }
    } else if (userRestaurantId) {
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

  // Get restaurant tables
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("table_number");

  return (
    <TableManagement
      user={user}
      restaurant={restaurantInfo}
      initialTables={tables || []}
    />
  );
}
