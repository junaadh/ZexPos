"use client";

import OrderManagement from "@/components/order-management";
import { UserType, Restaurant } from "@/lib/types";

interface OrderPageProps {
  user: UserType;
  restaurant: Restaurant | null;
}

export default function OrderPage({ user, restaurant }: OrderPageProps) {
  return <OrderManagement user={user} restaurant={restaurant} />;
}
