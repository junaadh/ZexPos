"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    ShoppingCart,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardMetrics {
    todaysRevenue: number;
    revenueChange: number;
    activeOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    staffCount: number;
    avgOrderTime: number;
    recentOrders: Array<{
        id: number;
        orderNumber: string;
        table: string;
        items: string;
        total: number;
        status: string;
        itemCount: number;
    }>;
}

interface DashboardStatsProps {
    userRole: string;
    restaurantId?: string; // Accept explicit restaurant ID
}

export function DashboardStats({ userRole, restaurantId }: DashboardStatsProps) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchMetrics() {
            try {
                let url = "/api/dashboard/metrics";
                if (restaurantId) {
                    url += `?restaurantId=${restaurantId}`;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error("Failed to fetch metrics");
                }
                const data = await response.json();
                setMetrics(data);
            } catch (err) {
                console.error("Error fetching dashboard metrics:", err);
                const errorMessage = err instanceof Error ? err.message : "Failed to load metrics";
                setError(errorMessage);
                toast.error(`Dashboard error: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
    }, [restaurantId]); const getStatusBadge = (status: string) => {
        switch (status) {
            case "ready":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                    </Badge>
                );
            case "preparing":
                return (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Cooking
                    </Badge>
                );
            case "pending":
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Loading skeletons for metrics cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Loading skeletons for activity cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div>
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            ${metrics.todaysRevenue.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <span className={metrics.revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                                {metrics.revenueChange >= 0 ? "+" : ""}{metrics.revenueChange.toFixed(1)}%
                            </span>{" "}
                            from yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary">{metrics.activeOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-orange-600">{metrics.pendingOrders} pending</span> •{" "}
                            {metrics.preparingOrders} in progress
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Staff Count</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.staffCount}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">All stations</span> covered
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Order Time</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgOrderTime}m</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">Good</span> performance
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Orders
                        </CardTitle>
                        <CardDescription>Latest customer orders and their status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {metrics.recentOrders.length > 0 ? (
                            metrics.recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-medium text-primary">
                                                {order.orderNumber}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {order.table} - {order.items}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} • $
                                                {order.total.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent orders found
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full justify-start"
                            size="lg"
                            onClick={() => router.push("/orders/new")}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Create New Order
                        </Button>
                        {(userRole === "org_admin" || userRole === "manager") && (
                            <Button
                                variant="outline"
                                className="w-full justify-start bg-transparent"
                                size="lg"
                                onClick={() => router.push("/staff")}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Staff
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            size="lg"
                            onClick={() => router.push("/reports")}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Sales Report
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            size="lg"
                            onClick={() => router.push("/orders")}
                        >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            View All Orders
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
