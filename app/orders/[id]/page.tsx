import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import OrderDetailsViewer from "@/components/order-details-viewer";

interface OrderDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
    const { supabase, user } = await getCurrentUser();

    if (!user) {
        notFound();
    }

    const { id: orderId } = await params;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/orders?id=${orderId}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            notFound();
        }

        const order = await response.json();

        // Get restaurant info
        let restaurant = null;
        if (order.restaurant_id) {
            const { data: restaurantData } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", order.restaurant_id)
                .single();
            restaurant = restaurantData;
        }

        return <OrderDetailsViewer order={order} user={user} restaurant={restaurant} />;
    } catch (error) {
        console.error('Error fetching order:', error);
        notFound();
    }
}
