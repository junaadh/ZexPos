import { redirect } from "next/navigation";
import { MenuManagement } from "@/components/menu-management";
import type { Restaurant } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

interface MenuPageProps {
    params: {
        id: string;
    };
}

export default async function RestaurantMenuPage({ params }: MenuPageProps) {
    const { supabase, user } = await getCurrentUser();
    const restaurantId = params.id;

    // Check if user has access to this restaurant
    let hasAccess = false;

    if (user.role === "super_admin") {
        hasAccess = true;
    } else if (user.role === "org_admin" && user.organization_id) {
        // Check if restaurant belongs to user's organization
        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("organization_id")
            .eq("id", restaurantId)
            .single();

        hasAccess = restaurant?.organization_id === user.organization_id;
    } else if (user.restaurant_id === restaurantId) {
        hasAccess = true;
    }

    if (!hasAccess) {
        redirect("/");
    }

    // Get restaurant details
    console.log("Fetching restaurant with ID:", restaurantId);
    const { data: restaurantInfo, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

    console.log("Restaurant query result:", { restaurantInfo, restaurantError });

    if (!restaurantInfo) {
        console.log("No restaurant found, redirecting to /restaurants");
        redirect("/restaurants");
    }

    // Get menu categories and items for the restaurant
    const { data: categories } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order");

    const { data: menuItems } = await supabase
        .from("menu_items")
        .select(`
      *,
      menu_categories (
        name
      )
    `)
        .eq("restaurant_id", restaurantId)
        .order("sort_order");

    return (
        <MenuManagement
            user={user}
            restaurant={restaurantInfo}
            initialCategories={categories || []}
            initialMenuItems={menuItems || []}
        />
    );
}
