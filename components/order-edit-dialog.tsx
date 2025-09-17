"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Minus,
    Trash2,
    Edit,
    Save,
    X,
} from "lucide-react";
import { Order, OrderItem, MenuItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface OrderEditDialogProps {
    open: boolean;
    onClose: () => void;
    order: Order | null;
    onOrderUpdate: (updatedOrder: Order) => void;
}

interface OrderItemWithMenu extends OrderItem {
    menu_items?: MenuItem;
}

export default function OrderEditDialog({
    open,
    onClose,
    order,
    onOrderUpdate,
}: OrderEditDialogProps) {
    const [orderItems, setOrderItems] = useState<OrderItemWithMenu[]>([]);
    const [availableMenuItems, setAvailableMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(1);
    const [editInstructions, setEditInstructions] = useState<string>("");
    const [hasChanges, setHasChanges] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
    const [orgId, setOrgId] = useState<string>('default');

    const supabase = createClient();

    const getMenuItemImageUrl = (item: MenuItem): string => {
        // If item has a stored image_url that's not a placeholder, use it
        if (item.image_url && item.image_url !== '/placeholder.jpg' && !item.image_url.includes('placeholder')) {
            return item.image_url;
        }

        // If no order context, fall back to placeholder
        if (!order) {
            return '/placeholder.jpg';
        }

        // Try to construct predictable image URL
        const restaurantId = order.restaurant_id;
        const itemId = item.id;

        // For the predictable naming, we'll default to jpg
        // The error handler will try other extensions if needed
        const predictablePath = `menu-items/${orgId}.${restaurantId}.${itemId}.jpg`;
        const predictableUrl = supabase.storage.from('menu-images').getPublicUrl(predictablePath).data.publicUrl;

        return predictableUrl;
    };

    useEffect(() => {
        if (order) {
            setCurrentOrder(order);
            setOrderItems(order.order_items || []);
            fetchRestaurant();
            fetchMenuItems();
        }
    }, [order]);

    const fetchOrderItems = async () => {
        if (!order) return;

        try {
            const response = await fetch(`/api/order-items?orderId=${order.id}`);
            if (response.ok) {
                const data = await response.json();
                setOrderItems(data);
            }
        } catch (error) {
            console.error('Error fetching order items:', error);
        }
    };

    const fetchMenuItems = async () => {
        if (!order) return;

        try {
            const response = await fetch(`/api/menu?restaurantId=${order.restaurant_id}`);
            if (response.ok) {
                const data = await response.json();
                setAvailableMenuItems(data.filter((item: MenuItem) => item.is_available));
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    const fetchRestaurant = async () => {
        try {
            // Get user data to extract organization_id
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.organization_id) {
                setOrgId(user.user_metadata.organization_id);
            }
        } catch (error) {
            console.error('Error fetching user organization:', error);
        }
    };

    const addMenuItem = async (menuItemId: string) => {
        if (!order) return;

        const menuItem = availableMenuItems.find(item => item.id === menuItemId);
        if (!menuItem) return;

        setLoading(true);
        try {
            const response = await fetch('/api/order-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: order.id,
                    menu_item_id: menuItemId,
                    quantity: 1,
                    unit_price: menuItem.price,
                    total_price: menuItem.price,
                }),
            });

            if (response.ok) {
                await fetchOrderItems();
                setHasChanges(true);
                // Refresh the order to get updated totals
                const orderResponse = await fetch(`/api/orders?id=${order.id}`);
                if (orderResponse.ok) {
                    const updatedOrder = await orderResponse.json();
                    setCurrentOrder(updatedOrder);
                    onOrderUpdate(updatedOrder);
                }
            }
        } catch (error) {
            console.error('Error adding menu item:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderItem = async (itemId: string, updates: any) => {
        if (!order) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/order-items?id=${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                await fetchOrderItems();
                setHasChanges(true);
                // Refresh the order to get updated totals
                const orderResponse = await fetch(`/api/orders?id=${order.id}`);
                if (orderResponse.ok) {
                    const updatedOrder = await orderResponse.json();
                    setCurrentOrder(updatedOrder);
                    onOrderUpdate(updatedOrder);
                }
            }
        } catch (error) {
            console.error('Error updating order item:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteOrderItem = async (itemId: string) => {
        if (!order) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/order-items?id=${itemId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchOrderItems();
                setHasChanges(true);
                // Refresh the order to get updated totals
                const orderResponse = await fetch(`/api/orders?id=${order.id}`);
                if (orderResponse.ok) {
                    const updatedOrder = await orderResponse.json();
                    setCurrentOrder(updatedOrder);
                    onOrderUpdate(updatedOrder);
                }
            }
        } catch (error) {
            console.error('Error deleting order item:', error);
        } finally {
            setLoading(false);
        }
    };

    const startEditingItem = (item: OrderItemWithMenu) => {
        setEditingItem(item.id);
        setEditQuantity(item.quantity);
        setEditInstructions(item.special_instructions || "");
    };

    const saveItemEdit = async () => {
        if (!editingItem) return;

        await updateOrderItem(editingItem, {
            quantity: editQuantity,
            special_instructions: editInstructions,
        });

        setEditingItem(null);
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditQuantity(1);
        setEditInstructions("");
    };

    const handleConfirmUpdate = () => {
        setHasChanges(false);
        onClose();
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirmed = window.confirm("You have unsaved changes. Are you sure you want to close without saving?");
            if (!confirmed) return;
        }
        setHasChanges(false);
        onClose();
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Order #{order.order_number}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Order Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Customer:</span>
                                    <p>{order.customer_name || "Walk-in"}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Type:</span>
                                    <p className="capitalize">{order.order_type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Status:</span>
                                    <Badge variant="secondary" className="capitalize">
                                        {order.status}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="font-medium">Total:</span>
                                    <p className="font-bold">${currentOrder?.total_amount.toFixed(2) || order.total_amount.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                        {/* Menu Item Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={getMenuItemImageUrl(item.menu_items || {} as MenuItem)}
                                                alt={item.menu_items?.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    const currentSrc = target.src;

                                                    // Extract base path without extension
                                                    const basePath = currentSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '');

                                                    // Try different extensions
                                                    if (currentSrc.endsWith('.jpg')) {
                                                        target.src = `${basePath}.png`;
                                                    } else if (currentSrc.endsWith('.png')) {
                                                        target.src = `${basePath}.jpeg`;
                                                    } else if (currentSrc.endsWith('.jpeg')) {
                                                        target.src = `${basePath}.webp`;
                                                    } else {
                                                        // All extensions failed, use placeholder
                                                        target.src = '/placeholder.jpg';
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.menu_items?.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                ${item.unit_price.toFixed(2)} each
                                            </p>
                                            {item.special_instructions && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Note: {item.special_instructions}
                                                </p>
                                            )}
                                        </div>

                                        {editingItem === item.id ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={editQuantity}
                                                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                                                    className="w-20"
                                                />
                                                <Textarea
                                                    placeholder="Special instructions"
                                                    value={editInstructions}
                                                    onChange={(e) => setEditInstructions(e.target.value)}
                                                    className="w-48 h-10"
                                                />
                                                <Button size="sm" onClick={saveItemEdit} disabled={loading}>
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Qty: {item.quantity}</span>
                                                <span className="font-bold">${item.total_price.toFixed(2)}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => startEditingItem(item)}
                                                    disabled={loading}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => deleteOrderItem(item.id)}
                                                    disabled={loading}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add New Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Items to Order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableMenuItems.map((item) => (
                                    <div key={item.id} className="border rounded-lg p-4">
                                        {/* Menu Item Image */}
                                        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
                                            <img
                                                src={getMenuItemImageUrl(item)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    const currentSrc = target.src;

                                                    // Extract base path without extension
                                                    const basePath = currentSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '');

                                                    // Try different extensions
                                                    if (currentSrc.endsWith('.jpg')) {
                                                        target.src = `${basePath}.png`;
                                                    } else if (currentSrc.endsWith('.png')) {
                                                        target.src = `${basePath}.jpeg`;
                                                    } else if (currentSrc.endsWith('.jpeg')) {
                                                        target.src = `${basePath}.webp`;
                                                    } else {
                                                        // All extensions failed, use placeholder
                                                        target.src = '/placeholder.jpg';
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <span className="font-bold text-green-600">
                                                ${item.price.toFixed(2)}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-600 mb-3">
                                                {item.description}
                                            </p>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => addMenuItem(item.id)}
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add to Order
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>${currentOrder?.subtotal.toFixed(2) || order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>${currentOrder?.tax_amount.toFixed(2) || order.tax_amount.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>${currentOrder?.total_amount.toFixed(2) || order.total_amount.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmUpdate}
                        disabled={loading || !hasChanges}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {hasChanges ? "Confirm Updates" : "No Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
