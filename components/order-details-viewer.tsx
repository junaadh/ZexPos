"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    Phone,
    CreditCard,
    Receipt,
    Edit,
    Printer
} from "lucide-react";
import { Order, OrderItem, UserType, Restaurant } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface OrderDetailsViewerProps {
    order: Order;
    user: UserType;
    restaurant: Restaurant | null;
}

export default function OrderDetailsViewer({ order, user, restaurant }: OrderDetailsViewerProps) {
    const router = useRouter();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'preparing': return 'bg-orange-100 text-orange-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'served': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewReceipt = async () => {
        try {
            const response = await fetch(`/api/receipts?orderId=${order.id}`);
            if (response.ok) {
                const receipt = await response.json();
                if (receipt) {
                    window.open(`/receipts/${receipt.id}`, '_blank');
                } else {
                    toast.error('No receipt found for this order');
                }
            } else {
                toast.error('Failed to find receipt for this order');
            }
        } catch (error) {
            console.error('Error fetching receipt:', error);
            toast.error('Failed to open receipt');
        }
    };

    return (
        <div className="flex h-screen">
            <AppSidebar user={user} restaurant={restaurant} />
            <main className="flex-1 overflow-auto">
                <div className="p-4">
                    <SidebarTrigger />
                </div>
                <div className="min-h-screen bg-gray-50 p-4">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Badge className={getStatusBadgeColor(order.status)}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                        <span className="text-gray-600">•</span>
                                        <span className="text-gray-600">{formatDate(order.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                {order.status === "completed" && (
                                    <Button
                                        variant="outline"
                                        onClick={handleViewReceipt}
                                    >
                                        <Receipt className="h-4 w-4 mr-2" />
                                        View Receipt
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Order Details */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {order.order_items?.map((item: OrderItem, index: number) => (
                                                <div key={index} className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{item.menu_items?.name || 'Unknown Item'}</h4>
                                                        {item.special_instructions && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                Note: {item.special_instructions}
                                                            </p>
                                                        )}
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {item.quantity} × {formatCurrency(item.unit_price)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {formatCurrency(item.total_price)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )) || (
                                                    <p className="text-gray-500">No items found</p>
                                                )}
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Order Totals */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(order.subtotal || 0)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Tax:</span>
                                                <span>{formatCurrency(order.tax_amount || 0)}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>Total:</span>
                                                <span>{formatCurrency(order.total_amount)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Order Info Sidebar */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">Created</p>
                                                <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                                            </div>
                                        </div>

                                        {order.restaurant_tables && (
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium">Table</p>
                                                    <p className="text-sm text-gray-600">
                                                        {order.restaurant_tables.table_name || `Table ${order.restaurant_tables.table_number}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {order.customer_name && (
                                            <div className="flex items-center space-x-2">
                                                <User className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium">Customer</p>
                                                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {order.customer_phone && (
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium">Phone</p>
                                                    <p className="text-sm text-gray-600">{order.customer_phone}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2">
                                            <CreditCard className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">Order Type</p>
                                                <p className="text-sm text-gray-600">
                                                    {order.order_type?.replace('_', ' ').toUpperCase() || 'DINE IN'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {order.kitchen_notes && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Kitchen Notes</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600">{order.kitchen_notes}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
