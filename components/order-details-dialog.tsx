"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Phone,
    CreditCard,
    Receipt,
    Printer
} from "lucide-react";
import { Order, OrderItem } from "@/lib/types";
import { toast } from "sonner";

interface OrderDetailsDialogProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    onViewReceipt?: (order: Order) => void;
}

export default function OrderDetailsDialog({ order, open, onClose, onViewReceipt }: OrderDetailsDialogProps) {
    if (!order) return null;

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

    const handleViewReceipt = () => {
        if (onViewReceipt) {
            onViewReceipt(order);
        } else {
            // Fallback to opening in new tab if no parent handler provided
            window.open(`/receipts/${order.id}`, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] min-w-[60vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Order #{order.order_number}</DialogTitle>
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge className={getStatusBadgeColor(order.status)}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-600">{formatDate(order.created_at)}</span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {order.status === "completed" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleViewReceipt}
                                >
                                    <Receipt className="h-4 w-4 mr-2" />
                                    View Receipt
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 lg:grid-cols-3 mt-4">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
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
                    <div className="space-y-4">
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
            </DialogContent>
        </Dialog>
    );
}
