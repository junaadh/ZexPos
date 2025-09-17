"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Clock,
  Download,
  Target,
} from "lucide-react";
import { Restaurant, UserType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const COLORS = ["#0891b2", "#f97316", "#4b5563", "#22c55e"];

interface AnalyticsProps {
  user: UserType;
  restaurant: Restaurant | null;
}

interface AnalyticsData {
  salesData: Array<{ date: string; revenue: number; orders: number; avgOrder: number }>;
  hourlyData: Array<{ hour: string; orders: number; revenue: number }>;
  popularItems: Array<{ name: string; orders: number; revenue: number; percentage: number }>;
  categoryData: Array<{ name: string; value: number; revenue: number }>;
  staffPerformance: Array<{ name: string; orders: number; revenue: number; avgTime: number; rating: number }>;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

export default function AnalyticsComponent({
  user,
  restaurant,
}: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    salesData: [],
    hourlyData: [],
    popularItems: [],
    categoryData: [],
    staffPerformance: [],
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!restaurant?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/analytics?restaurantId=${restaurant.id}&timeRange=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        } else {
          console.error('Failed to fetch analytics data');
          toast.error('Failed to load analytics data');
          // Fallback to empty data
          setAnalyticsData({
            salesData: [],
            hourlyData: [],
            popularItems: [],
            categoryData: [],
            staffPerformance: [],
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
          });
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast.error('Error loading analytics data');
        // Fallback to empty data
        setAnalyticsData({
          salesData: [],
          hourlyData: [],
          popularItems: [],
          categoryData: [],
          staffPerformance: [],
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [restaurant?.id, timeRange]);

  if (loading) {
    return (
      <div className="flex w-screen h-screen">
        <AppSidebar user={user} restaurant={restaurant} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger />
            <Skeleton className="h-6 w-48" />
          </header>
          <div className="flex-1 p-6 space-y-6">
            {/* Header with filters skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Key metrics skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-7 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>

            {/* Tables skeleton */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen">
      <AppSidebar user={user} restaurant={restaurant} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Analytics & Reports
              </h1>
              <p className="text-sm text-muted-foreground">
                Business insights and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Today</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="menu">Menu Analysis</TabsTrigger>
              <TabsTrigger value="staff">Staff Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      ${analyticsData.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12.5%
                      </span>
                      from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Orders
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">
                      {analyticsData.totalOrders}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8.2%
                      </span>
                      from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg Order Value
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${analyticsData.avgOrderValue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +3.8%
                      </span>
                      from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg Service Time
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">21m</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-red-600 flex items-center">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -2.1%
                      </span>
                      from last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>
                    Daily revenue over the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${value}`, "Revenue"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0891b2"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders by Hour */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Hour</CardTitle>
                  <CardDescription>
                    Peak hours and order distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Sales</CardTitle>
                    <CardDescription>
                      Revenue and order count by day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="revenue"
                          fill="#0891b2"
                          name="Revenue ($)"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="orders"
                          fill="#f97316"
                          name="Orders"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Order Value</CardTitle>
                    <CardDescription>
                      Trend of average order value
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `$${value}`,
                            "Avg Order Value",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgOrder"
                          stroke="#22c55e"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="menu" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Items</CardTitle>
                    <CardDescription>Best-selling menu items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analyticsData.popularItems.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.orders} orders
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${item.revenue}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                    <CardDescription>
                      Revenue distribution across menu categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) =>
                            `${name} ${(percentage || 0).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance</CardTitle>
                  <CardDescription>
                    Individual staff member metrics and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.staffPerformance.map((staff) => (
                      <div
                        key={staff.name}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">
                              {staff.name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{staff.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {staff.orders} orders served
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">
                              ${staff.revenue.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">Revenue</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{staff.avgTime}m</p>
                            <p className="text-muted-foreground">Avg Time</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {staff.rating}
                              </span>
                              <span className="text-yellow-500">★</span>
                            </div>
                            <p className="text-muted-foreground">Rating</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
