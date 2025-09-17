"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ArrowLeft, Save } from "lucide-react";
import { Restaurant, UserType, MenuItem, RestaurantTable } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface NewOrderComponentProps {
  user: UserType;
  restaurant: Restaurant | null;
}

export default function NewOrderComponent({
  user,
  restaurant,
}: NewOrderComponentProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedTable, setSelectedTable] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate predictable image URL for menu items
  const getMenuItemImageUrl = (item: MenuItem): string => {
    // If item has a stored image_url that's not a placeholder, use it
    if (item.image_url && item.image_url !== '/placeholder.jpg' && !item.image_url.includes('placeholder')) {
      return item.image_url;
    }

    // If no restaurant context, fall back to placeholder
    if (!restaurant) {
      return '/placeholder.jpg';
    }

    // Try to construct predictable image URL
    const orgId = restaurant.organization_id || 'default';
    const restaurantId = restaurant.id;
    const itemId = item.id;

    // For the predictable naming, we'll default to jpg
    // The error handler will try other extensions if needed
    const predictablePath = `menu-items/${orgId}.${restaurantId}.${itemId}.jpg`;
    const predictableUrl = supabase.storage.from('menu-images').getPublicUrl(predictablePath).data.publicUrl;

    return predictableUrl;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurant?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch menu items and tables in parallel
        const [menuResponse, tablesResponse] = await Promise.all([
          fetch(`/api/menu?restaurantId=${restaurant.id}`),
          fetch(`/api/tables?restaurantId=${restaurant.id}`)
        ]);

        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuItems(menuData);
        } else {
          console.error('Failed to fetch menu items');
        }

        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          setTables(tablesData);
        } else {
          console.error('Failed to fetch tables');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurant?.id]);

  const addItem = (menuItem: MenuItem) => {
    const existingItem = orderItems.find((item) => item.id === menuItem.id);
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter((item) => item.id !== id));
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const handleSubmitOrder = async () => {
    if (!restaurant?.id || orderItems.length === 0) {
      toast.error('Please add items to the order');
      return;
    }

    try {
      const subtotal = getTotalAmount();
      const taxAmount = subtotal * 0.1; // 10% tax
      const totalAmount = subtotal + taxAmount;

      const orderData = {
        restaurant_id: restaurant.id,
        table_id: selectedTable || null,
        customer_name: customerName || null,
        order_type: 'dine_in',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'pending',
        server_id: user.id,
        kitchen_notes: orderNotes || null,
        items: orderItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          special_instructions: item.notes || null
        }))
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        toast.success('Order created successfully');
        router.push("/orders");
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  if (loading) {
    return (
      <div className="flex w-screen h-screen">
        <AppSidebar user={user} restaurant={restaurant} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger />
            <Skeleton className="h-6 w-48" />
          </header>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Menu Items Skeleton */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Categories Skeleton */}
                    <div className="flex gap-2 mb-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-20" />
                      ))}
                    </div>

                    {/* Menu Items Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[...Array(9)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-full mb-2" />
                            <Skeleton className="h-6 w-16" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Skeleton */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-28" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-3 pt-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-6 w-12" />
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <div className="flex justify-between font-bold">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </a>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  New Order
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create a new customer order
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={orderItems.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Submit Order
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                  <CardDescription>
                    Basic details for the new order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="table">Table Number</Label>
                      <Select
                        value={selectedTable}
                        onValueChange={setSelectedTable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table.id} value={table.id}>
                              Table {table.table_number} ({table.seats} seats)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer Name</Label>
                      <Input
                        id="customer"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Special instructions or dietary requirements..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Menu Items</CardTitle>
                  <CardDescription>
                    Select items to add to the order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        {/* Menu Item Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
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

                        {/* Menu Item Details */}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.menu_categories?.name || 'No category'}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>

                        {/* Add Button */}
                        <Button size="sm" onClick={() => addItem(item)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>
                    Review items before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items added yet
                    </p>
                  ) : (
                    <>
                      {orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              ${item.price.toFixed(2)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="text-lg font-bold text-primary">
                          ${getTotalAmount().toFixed(2)}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className="w-full justify-center"
                      >
                        {orderItems.length} item
                        {orderItems.length !== 1 ? "s" : ""}
                      </Badge>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
