import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const { supabase, user } = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestedRestaurantId = searchParams.get('restaurantId');

        const userRole = user.role;
        const userRestaurantId = user.restaurant_id;
        const userOrganizationId = user.organization_id;        // Get today's date for filtering
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        let restaurantIds: string[] = [];

        // Handle requested restaurant ID with validation
        if (requestedRestaurantId) {
            if (userRole === "org_admin" && userOrganizationId) {
                // Validate org admin has access to this restaurant
                const { data: restaurant } = await supabase
                    .from("restaurants")
                    .select("id")
                    .eq("id", requestedRestaurantId)
                    .eq("organization_id", userOrganizationId)
                    .single();

                if (restaurant) {
                    restaurantIds = [requestedRestaurantId];
                }
            } else if (userRole === "super_admin") {
                // Super admin can access any restaurant
                restaurantIds = [requestedRestaurantId];
            } else if (userRestaurantId === requestedRestaurantId) {
                // Regular staff can only access their assigned restaurant
                restaurantIds = [requestedRestaurantId];
            }
        }

        // Fallback logic if no specific restaurant requested or access denied
        if (restaurantIds.length === 0) {
            if (userRole === "org_admin" && userOrganizationId) {
                // Org admins see metrics for all restaurants in their organization
                const { data: restaurants } = await supabase
                    .from("restaurants")
                    .select("id")
                    .eq("organization_id", userOrganizationId);

                if (restaurants && restaurants.length > 0) {
                    restaurantIds = restaurants.map((r: any) => r.id);
                }
            } else if (userRestaurantId) {
                // Regular staff see metrics for their assigned restaurant only
                restaurantIds = [userRestaurantId];
            } else {
                return NextResponse.json({ error: "No restaurant access" }, { status: 403 });
            }
        } if (restaurantIds.length === 0) {
            return NextResponse.json({
                todaysRevenue: 0,
                revenueChange: 0,
                activeOrders: 0,
                pendingOrders: 0,
                preparingOrders: 0,
                staffCount: 0,
                avgOrderTime: 0,
                recentOrders: [],
                hourlyData: []
            });
        }

        // Fetch today's revenue
        let todaysOrdersQuery = supabase
            .from("orders")
            .select("total_amount")
            .gte("created_at", todayStart.toISOString())
            .lt("created_at", todayEnd.toISOString())
            .eq("payment_status", "paid");

        if (restaurantIds.length === 1) {
            todaysOrdersQuery = todaysOrdersQuery.eq("restaurant_id", restaurantIds[0]);
        } else {
            todaysOrdersQuery = todaysOrdersQuery.in("restaurant_id", restaurantIds);
        }

        const { data: todaysOrders, error: revenueError } = await todaysOrdersQuery;

        if (revenueError) {
            console.error("Error fetching revenue:", revenueError);
            return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
        }

        const todaysRevenue = todaysOrders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

        // Fetch yesterday's revenue for comparison
        const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        const yesterdayEnd = todayStart;

        let yesterdaysOrdersQuery = supabase
            .from("orders")
            .select("total_amount")
            .gte("created_at", yesterdayStart.toISOString())
            .lt("created_at", yesterdayEnd.toISOString())
            .eq("payment_status", "paid");

        if (restaurantIds.length === 1) {
            yesterdaysOrdersQuery = yesterdaysOrdersQuery.eq("restaurant_id", restaurantIds[0]);
        } else {
            yesterdaysOrdersQuery = yesterdaysOrdersQuery.in("restaurant_id", restaurantIds);
        }

        const { data: yesterdaysOrders } = await yesterdaysOrdersQuery;

        const yesterdaysRevenue = yesterdaysOrders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
        const revenueChange = yesterdaysRevenue > 0 ? ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100 : 0;

        // Fetch active orders
        let activeOrdersQuery = supabase
            .from("orders")
            .select("id, status")
            .in("status", ["pending", "confirmed", "preparing", "ready"]);

        if (restaurantIds.length === 1) {
            activeOrdersQuery = activeOrdersQuery.eq("restaurant_id", restaurantIds[0]);
        } else {
            activeOrdersQuery = activeOrdersQuery.in("restaurant_id", restaurantIds);
        }

        const { data: activeOrders, error: ordersError } = await activeOrdersQuery;

        if (ordersError) {
            console.error("Error fetching active orders:", ordersError);
            return NextResponse.json({ error: "Failed to fetch orders data" }, { status: 500 });
        }

        const totalActiveOrders = activeOrders?.length || 0;
        const pendingOrders = activeOrders?.filter((order: any) => order.status === "pending").length || 0;
        const preparingOrders = activeOrders?.filter((order: any) => order.status === "preparing").length || 0;

        // Fetch staff count
        let staffQuery = supabase
            .from("staff")
            .select("id")
            .in("role", ["server", "kitchen", "cashier", "manager"])
            .eq("is_active", true);

        if (restaurantIds.length === 1) {
            staffQuery = staffQuery.eq("restaurant_id", restaurantIds[0]);
        } else {
            staffQuery = staffQuery.in("restaurant_id", restaurantIds);
        }

        const { data: staffData, error: staffError } = await staffQuery;

        if (staffError) {
            console.error("Error fetching staff:", staffError);
        }

        const staffCount = staffData?.length || 0;

        // Calculate average order time (simplified - using a mock calculation)
        const avgOrderTime = Math.floor(Math.random() * 10) + 15; // 15-25 minutes

        // Fetch recent orders
        let recentOrdersQuery = supabase
            .from("orders")
            .select(`
        id,
        table_id,
        total_amount,
        status,
        created_at,
        restaurant_tables(table_number),
        order_items(
          quantity,
          menu_items(name)
        )
      `)
            .order("created_at", { ascending: false })
            .limit(5);

        if (restaurantIds.length === 1) {
            recentOrdersQuery = recentOrdersQuery.eq("restaurant_id", restaurantIds[0]);
        } else {
            recentOrdersQuery = recentOrdersQuery.in("restaurant_id", restaurantIds);
        }

        const { data: recentOrders, error: recentError } = await recentOrdersQuery;

        if (recentError) {
            console.error("Error fetching recent orders:", recentError);
        }

        const formattedRecentOrders = recentOrders?.map((order: any) => {
            const itemNames = order.order_items?.map((item: any) => item.menu_items?.name).filter(Boolean);
            const mainItem = itemNames?.[0] || "Unknown Item";
            const itemCount = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
            const tableNumber = order.restaurant_tables?.table_number;

            return {
                id: order.id,
                orderNumber: `#${order.id.toString().slice(-3)}`,
                table: tableNumber ? `Table ${tableNumber}` : "Takeout",
                items: `${mainItem}${itemCount > 1 ? ` + ${itemCount - 1} more` : ""}`,
                total: order.total_amount,
                status: order.status,
                itemCount
            };
        }) || [];

        // Get hourly sales data for today (simplified version)
        const hourlyData = [];
        const currentHour = new Date().getHours();

        // Generate sample hourly data for visualization
        for (let hour = Math.max(0, currentHour - 6); hour <= currentHour; hour++) {
            const hourlyRevenue = Math.random() * (todaysRevenue / 8); // Distribute revenue across hours
            hourlyData.push({
                hour: `${hour}:00`,
                revenue: Number(hourlyRevenue.toFixed(2))
            });
        }

        return NextResponse.json({
            todaysRevenue: Number(todaysRevenue.toFixed(2)),
            revenueChange: Number(revenueChange.toFixed(1)),
            activeOrders: totalActiveOrders,
            pendingOrders,
            preparingOrders,
            staffCount,
            avgOrderTime,
            recentOrders: formattedRecentOrders,
            hourlyData
        });

    } catch (error) {
        console.error("Dashboard metrics error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
