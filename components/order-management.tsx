"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import PaymentCompletionDialog from "@/components/payment-completion-dialog";
import OrderEditDialog from "@/components/order-edit-dialog";
import OrderDetailsDialog from "@/components/order-details-dialog";
import ReceiptModal from "@/components/receipt-modal";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Plus,
    RefreshCw,
    Edit,
    Receipt,
    Printer,
    FileText,
} from "lucide-react";
import { Restaurant, UserType, Order } from "@/lib/types";
import Link from "next/link";
import { toast } from "sonner";

const statusConfig = {
    pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
    },
    confirmed: {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
    },
    completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
    },
    cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
    },
};

export interface OrderManagementProps {
    user: UserType;
    restaurant: Restaurant | null;
}

export default function OrderManagement({ user, restaurant }: OrderManagementProps) {
    console.log("OrderManagement component - restaurant:", restaurant);

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Computed state
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_number.toString().includes(searchTerm) ||
            order.customer_phone?.includes(searchTerm);

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleViewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsDialogOpen(true);
    };

    const handleViewReceipt = async (order: Order) => {
        try {
            // First check if receipt exists for this order
            const response = await fetch(`/api/receipts?orderId=${order.id}`);
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    toast.error('Invalid response from server');
                    return;
                }

                const receipt = await response.json();
                if (receipt && !receipt.error) {
                    // Open receipt in modal instead of new tab
                    setSelectedReceiptId(receipt.id);
                    setReceiptModalOpen(true);
                } else {
                    toast.error(receipt?.error || 'No receipt found for this order');
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                toast.error(`Failed to find receipt: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching receipt:', error);
            toast.error('Failed to open receipt');
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            const response = await fetch(`/api/orders?id=${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (response.ok) {
                setOrders(
                    orders.map((order) =>
                        order.id === orderId ? { ...order, status: newStatus } : order,
                    ),
                );
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                console.error('Failed to update order status');
                toast.error('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Error updating order status');
        }
    };

    const handleCompleteOrder = (order: Order) => {
        setSelectedOrder(order);
        setPaymentDialogOpen(true);
    };

    const handleEditOrder = (order: Order) => {
        // Navigate to edit order page
        window.open(`/orders/edit/${order.id}`, '_blank');
    };

    const handlePrintKitchenTicket = async (order: Order) => {
        try {
            await updateOrderStatus(order.id, 'confirmed');
            await printKitchenTicket(order);
            toast.success('Kitchen ticket printed and order confirmed');
        } catch (error) {
            toast.error('Failed to print kitchen ticket');
        }
    };

    const handlePrintAdditionalItems = async (order: Order) => {
        try {
            // Print only new items since last kitchen ticket
            await printAdditionalItemsTicket(order);
            toast.success('Additional items ticket printed');
        } catch (error) {
            toast.error('Failed to print additional items ticket');
        }
    };

    const printKitchenTicket = async (order: Order) => {
        // Implementation for printing kitchen ticket
        const printContent = generateKitchenTicketContent(order);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const printAdditionalItemsTicket = async (order: Order) => {
        // Implementation for printing additional items
        toast.success('Additional items ticket printed');
    };

    const generateKitchenTicketContent = (order: Order) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kitchen Ticket - Order #${order.order_number}</title>
                <style>
                    body { font-family: monospace; font-size: 14px; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .item { margin-bottom: 10px; }
                    .notes { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>KITCHEN TICKET</h2>
                    <p>Order #${order.order_number}</p>
                    <p>Table: ${order.table_number || 'N/A'}</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                </div>
                <div class="items">
                    ${order.order_items?.map(item => `
                        <div class="item">
                            <strong>${item.quantity}x ${item.menu_items?.name || 'Unknown Item'}</strong>
                            ${item.special_instructions ? `<br>Note: ${item.special_instructions}` : ''}
                        </div>
                    `).join('') || ''}
                </div>
                ${order.kitchen_notes ? `<div class="notes"><strong>Kitchen Notes:</strong><br>${order.kitchen_notes}</div>` : ''}
            </body>
            </html>
        `;
    };

    const handleOrderUpdate = (updatedOrder: Order) => {
        setOrders(orders.map(order =>
            order.id === updatedOrder.id ? updatedOrder : order
        ));
    };

    const handlePaymentComplete = () => {
        // Refresh orders after payment completion
        if (selectedOrder) {
            updateOrderStatus(selectedOrder.id, 'completed');
        }
        setPaymentDialogOpen(false);
        setSelectedOrder(null);
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} hover:${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    useEffect(() => {
        // Load orders from database
        const loadOrders = async () => {
            if (!restaurant?.id) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/orders?restaurantId=${restaurant.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrders(data);
                } else {
                    console.error('Failed to fetch orders');
                    toast.error('Failed to load orders');
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                toast.error('Error loading orders');
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [restaurant?.id]);

    if (loading) {
        return (
            <div className="flex h-screen">
                <AppSidebar user={user} restaurant={restaurant} />
                <main className="flex-1 overflow-auto">
                    <div className="p-4">
                        <SidebarTrigger />
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Header Skeleton */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Skeleton className="h-8 w-48 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>

                        {/* Stats Cards Skeleton */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-4" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-7 w-16 mb-1" />
                                        <Skeleton className="h-3 w-32" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Filters Skeleton */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-10 w-40" />
                            <Skeleton className="h-10 w-40" />
                        </div>

                        {/* Table Skeleton */}
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <Skeleton className="h-10 w-10" />
                                                <div>
                                                    <Skeleton className="h-4 w-24 mb-2" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-6 w-20" />
                                                <Skeleton className="h-8 w-24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="flex w-screen h-screen">
                <AppSidebar user={user} restaurant={restaurant} />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="w-96">
                        <CardHeader>
                            <CardTitle>Select Restaurant</CardTitle>
                            <CardDescription>
                                {user.role === 'super_admin' || user.role === 'org_admin'
                                    ? "Choose a restaurant from the sidebar to view its orders."
                                    : "No restaurant found for your account. Please contact your administrator or set up a restaurant."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-gray-600">
                                User Role: <span className="font-medium">{user.role}</span>
                            </p>
                            {user.organization_id && (
                                <p className="text-sm text-gray-600">
                                    Organization ID: <span className="font-medium">{user.organization_id}</span>
                                </p>
                            )}
                            {user.restaurant_id && (
                                <p className="text-sm text-gray-600">
                                    Restaurant ID: <span className="font-medium">{user.restaurant_id}</span>
                                </p>
                            )}
                            {(user.role !== 'super_admin' && user.role !== 'org_admin') && (
                                <Link href="/restaurants">
                                    <Button className="w-full">
                                        Manage Restaurants
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </div>
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
                                Order Management
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Track and manage all orders in real-time
                            </p>
                        </div>
                        <Link href="/orders/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Order
                            </Button>
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Orders
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {orders.length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {orders.filter((o) => o.status === "pending").length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    In Kitchen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {orders.filter((o) => o.status === "confirmed").length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {orders.filter((o) => o.status === "completed").length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters & Search
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search orders, customers, phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Orders</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="preparing">Preparing</SelectItem>
                                        <SelectItem value="ready">Ready</SelectItem>
                                        <SelectItem value="served">Served</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
                            <CardDescription>
                                Manage order status and track preparation progress
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Table/Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Server</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.order_number}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {order.restaurant_tables?.table_name ||
                                                            `Table ${order.restaurant_tables?.table_number}` ||
                                                            'No table'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {order.customer_name || 'Walk-in'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {order.order_items?.slice(0, 2).map(item => item.menu_items?.name).join(", ") || 'No items'}
                                                    {order.order_items && order.order_items.length > 2 &&
                                                        ` +${order.order_items.length - 2} more`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                ${order.total_amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {order.actual_prep_time || order.estimated_prep_time || '--'}m
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {order.staff?.full_name || 'Unassigned'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>

                                                        {/* Always allow editing for pending and confirmed orders */}
                                                        {(order.status === "pending" || order.status === "confirmed") && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditOrder(order)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit Order
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Print kitchen ticket for pending orders */}
                                                        {order.status === "pending" && (
                                                            <DropdownMenuItem
                                                                onClick={() => handlePrintKitchenTicket(order)}
                                                            >
                                                                <Printer className="h-4 w-4 mr-2" />
                                                                Print Kitchen Ticket
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Print additional items ticket for edited confirmed orders */}
                                                        {order.status === "confirmed" && (
                                                            <DropdownMenuItem
                                                                onClick={() => handlePrintAdditionalItems(order)}
                                                            >
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Print Additional Items
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Complete and pay for confirmed orders */}
                                                        {order.status === "confirmed" && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleCompleteOrder(order)}
                                                            >
                                                                <Receipt className="h-4 w-4 mr-2" />
                                                                Complete & Pay
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* View receipt for completed orders */}
                                                        {order.status === "completed" && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewReceipt(order)}
                                                            >
                                                                <Receipt className="h-4 w-4 mr-2" />
                                                                View Receipt
                                                            </DropdownMenuItem>
                                                        )}

                                                        {order.status !== "completed" && (
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() =>
                                                                    updateOrderStatus(order.id, "cancelled")
                                                                }
                                                            >
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                Cancel Order
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Payment Completion Dialog */}
            {selectedOrder && (
                <PaymentCompletionDialog
                    order={selectedOrder}
                    isOpen={paymentDialogOpen}
                    onClose={() => {
                        setPaymentDialogOpen(false);
                        setSelectedOrder(null);
                    }}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}

            {/* Order Edit Dialog */}
            <OrderEditDialog
                open={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
                onOrderUpdate={handleOrderUpdate}
            />

            {/* Order Details Dialog */}
            <OrderDetailsDialog
                open={detailsDialogOpen}
                onClose={() => {
                    setDetailsDialogOpen(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
                onViewReceipt={handleViewReceipt}
            />

            {/* Receipt Modal */}
            <ReceiptModal
                receiptId={selectedReceiptId}
                open={receiptModalOpen}
                onClose={() => {
                    setReceiptModalOpen(false);
                    setSelectedReceiptId(null);
                }}
            />
        </div>
    );
}
