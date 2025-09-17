import NewOrderComponent from "@/components/neworder";
import { Restaurant } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewOrderPage() {
  const { supabase, user } = await getCurrentUser();

  const userRole = user.role;
  const userRestaurantId = user.restaurant_id;

  let restaurantInfo: Restaurant | null = null;
  let restaurantId = userRestaurantId;

  if (userRole === "super_admin" || userRole === "org_admin") {
    // For super admin and org admin, get first restaurant or handle restaurant selection
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("*")
      .limit(1);

    if (restaurants && restaurants.length > 0) {
      restaurantInfo = restaurants[0];
      restaurantId = restaurants[0].id;
    }
  } else if (userRestaurantId) {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", userRestaurantId)
      .single();
    restaurantInfo = restaurant;
  }

  if (!restaurantId) {
    redirect("/restaurants/add");
  }

  return <NewOrderComponent user={user} restaurant={restaurantInfo} />;
}
