import { redirect } from "next/navigation";
import { MenuManagement } from "@/components/menu-management";
import type { Restaurant, MenuCategory, MenuItem } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

interface MenuPageProps {
  searchParams: Promise<{
    restaurant?: string;
  }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const { supabase, user } = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  const userRole = user.role;
  const userRestaurantId = user.restaurant_id;
  const urlRestaurantId = resolvedSearchParams.restaurant;

  let restaurantInfo: Restaurant | null = null;
  let restaurantId = urlRestaurantId || userRestaurantId;

  console.log("Menu page - URL restaurant ID:", urlRestaurantId);
  console.log("Menu page - User restaurant ID:", userRestaurantId);
  console.log("Menu page - Final restaurant ID:", restaurantId);

  // Check permissions for the requested restaurant
  if (urlRestaurantId) {
    if (userRole === "super_admin") {
      // Super admin can access any restaurant
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", urlRestaurantId)
        .single();
      restaurantInfo = restaurant;
    } else if (userRole === "org_admin" && user.organization_id) {
      // Org admin can access restaurants in their organization
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", urlRestaurantId)
        .eq("organization_id", user.organization_id)
        .single();
      restaurantInfo = restaurant;
    } else if (userRestaurantId === urlRestaurantId) {
      // User can access their own restaurant
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", urlRestaurantId)
        .single();
      restaurantInfo = restaurant;
    } else {
      // Unauthorized access to this restaurant
      redirect("/");
    }
  } else if (userRole === "super_admin" || userRole === "org_admin") {
    // For admins, don't auto-select a restaurant - they should choose explicitly
    // Only proceed if a specific restaurant is requested via URL parameter
    if (!urlRestaurantId) {
      // Render the menu component without restaurant data - it will show a restaurant selector
      return (
        <MenuManagement
          user={user}
          restaurant={null}
          initialCategories={[]}
          initialMenuItems={[]}
        />
      );
    }
  } else if (userRestaurantId) {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", userRestaurantId)
      .single();
    restaurantInfo = restaurant;
  }

  // For non-admin users, restaurant is required
  if (!restaurantId && (userRole !== "super_admin" && userRole !== "org_admin")) {
    redirect("/restaurants/add");
  }

  // Get menu categories and items for the restaurant (only if restaurant is selected)
  let categories: MenuCategory[] = [];
  let menuItems: MenuItem[] = [];

  if (restaurantId) {
    const { data: categoriesData } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order");

    const { data: menuItemsData } = await supabase
      .from("menu_items")
      .select(`
        *,
        menu_categories (
          name
        )
      `)
      .eq("restaurant_id", restaurantId)
      .order("sort_order");

    categories = categoriesData || [];
    menuItems = menuItemsData || [];
  }

  return (
    <MenuManagement
      user={user}
      restaurant={restaurantInfo}
      initialCategories={categories}
      initialMenuItems={menuItems}
    />
  );
}
