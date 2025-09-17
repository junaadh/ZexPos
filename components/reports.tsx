"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, DollarSign } from "lucide-react";
import { Restaurant, UserType } from "@/lib/types";

// Mock report data
const salesReports = [
  {
    id: "1",
    name: "Daily Sales Summary",
    date: "2024-01-15",
    revenue: 4567.5,
    orders: 72,
    avgOrder: 63.43,
    status: "completed",
  },
  {
    id: "2",
    name: "Weekly Performance",
    date: "2024-01-14",
    revenue: 23482.0,
    orders: 331,
    avgOrder: 70.94,
    status: "completed",
  },
  {
    id: "3",
    name: "Monthly Overview",
    date: "2024-01-01",
    revenue: 89234.5,
    orders: 1247,
    avgOrder: 71.56,
    status: "processing",
  },
];

const inventoryReports = [
  { item: "Beef Patties", current: 45, minimum: 20, status: "good" },
  { item: "Pizza Dough", current: 12, minimum: 15, status: "low" },
  { item: "Salmon Fillets", current: 8, minimum: 10, status: "low" },
  { item: "Lettuce", current: 25, minimum: 10, status: "good" },
  { item: "Tomatoes", current: 18, minimum: 15, status: "good" },
];

export interface ReportsComponentProps {
  user: UserType;
  restaurant: Restaurant | null;
}

export default function ReportsComponent({
  user,
  restaurant,
}: ReportsComponentProps) {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("7d");

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      processing: {
        label: "Processing",
        color: "bg-yellow-100 text-yellow-800",
      },
      failed: { label: "Failed", color: "bg-red-100 text-red-800" },
    };
    const statusConfig = config[status as keyof typeof config];
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  const getInventoryStatus = (status: string) => {
    const config = {
      good: { label: "Good", color: "bg-green-100 text-green-800" },
      low: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" },
      out: { label: "Out of Stock", color: "bg-red-100 text-red-800" },
    };
    const statusConfig = config[status as keyof typeof config];
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="flex w-screen h-screen">
      <AppSidebar user={user} restaurant={restaurant} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Reports</h1>
              <p className="text-sm text-muted-foreground">
                Generate and download business reports
              </p>
            </div>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {/* Report Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Configure and generate custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="inventory">
                        Inventory Report
                      </SelectItem>
                      <SelectItem value="staff">Staff Performance</SelectItem>
                      <SelectItem value="menu">Menu Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Today</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input type="date" id="start-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input type="date" id="end-date" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Sales Reports
                </CardTitle>
                <CardDescription>
                  Previously generated sales reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{report.name}</h4>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.date}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${report.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{report.orders} orders</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>
                  Current inventory levels and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Minimum</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryReports.map((item) => (
                      <TableRow key={item.item}>
                        <TableCell className="font-medium">
                          {item.item}
                        </TableCell>
                        <TableCell>{item.current}</TableCell>
                        <TableCell>{item.minimum}</TableCell>
                        <TableCell>{getInventoryStatus(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Reports Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">47</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Data Exported
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">2.3GB</div>
                <p className="text-xs text-muted-foreground">Total size</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Generation Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2s</div>
                <p className="text-xs text-muted-foreground">Per report</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
