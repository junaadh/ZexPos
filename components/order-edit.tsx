"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus, Save, Printer, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { UserType, Order, MenuItem, MenuCategory, OrderItem } from "@/lib/types"

interface OrderEditComponentProps {
    user: UserType
    order: Order & {
        order_items: (OrderItem & {
            menu_items: MenuItem
        })[]
        restaurants: {
            id: string
            name: string
            organization_id: string
        }
    }
    menuItems: MenuItem[]
    categories: MenuCategory[]
}

type ExtendedOrderItem = OrderItem & { menu_items: MenuItem }

export function OrderEditComponent({ user, order, menuItems, categories }: OrderEditComponentProps) {
    const [orderItems, setOrderItems] = useState<ExtendedOrderItem[]>(order.order_items)
    const [customerName, setCustomerName] = useState(order.customer_name || "")
    const [customerPhone, setCustomerPhone] = useState(order.customer_phone || "")
    const [kitchenNotes, setKitchenNotes] = useState(order.kitchen_notes || "")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [loading, setLoading] = useState(false)

    const filteredMenuItems = selectedCategory === "all"
        ? menuItems
        : menuItems.filter(item => item.category_id === selectedCategory)

    const addMenuItem = (menuItem: MenuItem) => {
        const existingItem = orderItems.find(item => item.menu_item_id === menuItem.id)

        if (existingItem) {
            setOrderItems(items =>
                items.map(item =>
                    item.menu_item_id === menuItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            )
        } else {
            const newOrderItem: ExtendedOrderItem = {
                id: `temp-${Date.now()}`,
                order_id: order.id,
                menu_item_id: menuItem.id,
                quantity: 1,
                unit_price: menuItem.price,
                total_price: menuItem.price,
                special_instructions: "",
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                menu_items: menuItem
            }
            setOrderItems(items => [...items, newOrderItem])
        }
    }

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setOrderItems(items => items.filter(item => item.id !== itemId))
        } else {
            setOrderItems(items =>
                items.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
                        : item
                )
            )
        }
    }

    const updateSpecialInstructions = (itemId: string, instructions: string) => {
        setOrderItems(items =>
            items.map(item =>
                item.id === itemId ? { ...item, special_instructions: instructions } : item
            )
        )
    }

    const calculateTotal = () => {
        return orderItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0)
    }

    const handleSaveOrder = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    kitchen_notes: kitchenNotes,
                    items: orderItems.map(item => ({
                        id: item.id.startsWith('temp-') ? undefined : item.id,
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        special_instructions: item.special_instructions
                    })),
                    total_amount: calculateTotal()
                })
            })

            if (!response.ok) throw new Error('Failed to update order')

            toast.success('Order updated successfully')

            // If order was confirmed, print additional items ticket
            if (order.status === 'confirmed') {
                await printAdditionalItemsTicket()
            }

        } catch (error) {
            toast.error('Failed to update order')
        } finally {
            setLoading(false)
        }
    }

    const printAdditionalItemsTicket = async () => {
        // Implementation for printing additional items
        const printContent = generateAdditionalItemsTicketContent()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(printContent)
            printWindow.document.close()
            printWindow.print()
        }
        toast.success('Additional items ticket printed')
    }

    const generateAdditionalItemsTicketContent = () => {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Additional Items - Order #${order.order_number}</title>
        <style>
          body { font-family: monospace; font-size: 14px; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .item { margin-bottom: 10px; }
          .notes { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>ADDITIONAL ITEMS</h2>
          <p>Order #${order.order_number}</p>
          <p>Table: ${order.table_number || 'N/A'}</p>
          <p>Time: ${new Date().toLocaleTimeString()}</p>
        </div>
        <div class="items">
          ${orderItems.map(item => `
            <div class="item">
              <strong>${item.quantity}x ${item.menu_items.name}</strong>
              ${item.special_instructions ? `<br>Note: ${item.special_instructions}` : ''}
            </div>
          `).join('')}
        </div>
        <div class="notes">
          <p><strong>*** ADDITIONAL ITEMS ONLY ***</strong></p>
          <p>Add to existing order</p>
        </div>
      </body>
      </html>
    `
    }

    return (
        <SidebarProvider>
            <AppSidebar user={user} restaurant={{
                ...order.restaurants,
                address: '',
                is_active: true,
                created_at: '',
                updated_at: ''
            }} />
            <main className="flex-1 overflow-hidden">
                <div className="flex h-full">
                    {/* Left side - Menu items */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <SidebarTrigger />
                            <Link href="/orders">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Orders
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">Edit Order #{order.order_number}</h1>
                                <p className="text-muted-foreground">
                                    Status: <Badge>{order.status}</Badge> • Restaurant: {order.restaurants.name}
                                </p>
                            </div>
                        </div>

                        {/* Category tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto">
                            <Button
                                variant={selectedCategory === "all" ? "default" : "outline"}
                                onClick={() => setSelectedCategory("all")}
                            >
                                All Items
                            </Button>
                            {categories.map(category => (
                                <Button
                                    key={category.id}
                                    variant={selectedCategory === category.id ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>

                        {/* Menu items grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMenuItems.map(item => (
                                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <Badge variant="secondary">${item.price.toFixed(2)}</Badge>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                                        )}
                                        <Button
                                            onClick={() => addMenuItem(item)}
                                            className="w-full"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add to Order
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right side - Order summary */}
                    <div className="w-96 border-l bg-muted/20 p-6 overflow-y-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Customer details */}
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">Customer Name</Label>
                                    <Input
                                        id="customerName"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter customer name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customerPhone">Phone Number</Label>
                                    <Input
                                        id="customerPhone"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kitchenNotes">Kitchen Notes</Label>
                                    <Textarea
                                        id="kitchenNotes"
                                        value={kitchenNotes}
                                        onChange={(e) => setKitchenNotes(e.target.value)}
                                        placeholder="Special instructions for kitchen"
                                    />
                                </div>

                                <Separator />

                                {/* Order items */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Items ({orderItems.length})</h3>
                                    {orderItems.map(item => (
                                        <div key={item.id} className="border rounded p-3 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.menu_items.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        ${item.unit_price.toFixed(2)} each
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <Input
                                                placeholder="Special instructions..."
                                                value={item.special_instructions || ''}
                                                onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    ))}

                                    {orderItems.length === 0 && (
                                        <p className="text-center text-muted-foreground py-4">
                                            No items in order. Add items from the menu.
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Total */}
                                <div className="flex justify-between items-center font-semibold text-lg">
                                    <span>Total:</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>

                                <Button
                                    onClick={handleSaveOrder}
                                    disabled={loading || orderItems.length === 0}
                                    className="w-full"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>

                                {order.status === 'confirmed' && (
                                    <Button
                                        onClick={printAdditionalItemsTicket}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print Additional Items
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </SidebarProvider>
    )
}
