import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ReceiptGenerator from '@/components/receipt-generator';
import ReceiptTemplateManager from '@/components/receipt-template-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Receipt, Settings } from 'lucide-react';
import { getOrder, getRestaurant } from '@/lib/database';

interface ReceiptPageProps {
    params: {
        id: string; // restaurant id
    };
    searchParams: {
        orderId?: string;
    };
}

export default async function ReceiptPage({ params, searchParams }: ReceiptPageProps) {
    const restaurantId = params.id;
    const orderId = searchParams.orderId;

    // Get restaurant data
    const restaurantResult = await getRestaurant(restaurantId);
    if (restaurantResult.error || !restaurantResult.data) {
        notFound();
    }

    const restaurant = restaurantResult.data;

    // Get order data if orderId is provided
    let order = null;
    if (orderId) {
        const orderResult = await getOrder(orderId);
        if (orderResult.data) {
            order = orderResult.data;
        }
    }

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar restaurant={restaurant} user={{ role: 'admin' } as any} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center gap-4 border-b bg-background px-6 py-3">
                    <SidebarTrigger />
                    <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        <h1 className="text-xl font-semibold">Receipt Management</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Header */}
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Receipt Management</h2>
                            <p className="text-muted-foreground">
                                Generate receipts for completed orders and manage receipt templates
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Receipt Generator */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Generate Receipt</h3>

                                {order ? (
                                    <Suspense fallback={<div>Loading receipt generator...</div>}>
                                        <ReceiptGenerator
                                            order={order}
                                            onReceiptGenerated={(receiptId) => {
                                                // Receipt generated successfully
                                            }}
                                        />
                                    </Suspense>
                                ) : (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-medium mb-2">No Order Selected</h3>
                                            <p className="text-muted-foreground text-center max-w-sm">
                                                Select an order from the orders page to generate a receipt, or use the URL parameter ?orderId=ORDER_ID
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recent Orders for Testing */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Recent Paid Orders</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Suspense fallback={<div>Loading orders...</div>}>
                                            <RecentPaidOrders restaurantId={restaurantId} />
                                        </Suspense>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Receipt Template Manager */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Receipt Templates</h3>
                                <Suspense fallback={<div>Loading template manager...</div>}>
                                    <ReceiptTemplateManager restaurantId={restaurantId} />
                                </Suspense>
                            </div>
                        </div>

                        <Separator />

                        {/* Receipt History */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
                            <Suspense fallback={<div>Loading receipt history...</div>}>
                                <ReceiptHistory restaurantId={restaurantId} />
                            </Suspense>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

async function RecentPaidOrders({ restaurantId }: { restaurantId: string }) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders?restaurantId=${restaurantId}&status=served&limit=5`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();

        if (!orders.length) {
            return (
                <p className="text-sm text-muted-foreground">
                    No recent paid orders found
                </p>
            );
        }

        return (
            <div className="space-y-2">
                {orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                            <span className="font-medium">#{order.order_number}</span>
                            <span className="text-muted-foreground ml-2">
                                ${order.total_amount.toFixed(2)}
                            </span>
                        </div>
                        <a
                            href={`/restaurants/${restaurantId}/receipts?orderId=${order.id}`}
                            className="text-primary hover:underline"
                        >
                            Generate Receipt
                        </a>
                    </div>
                ))}
            </div>
        );
    } catch (error) {
        return (
            <p className="text-sm text-red-500">
                Failed to load recent orders
            </p>
        );
    }
}

async function ReceiptHistory({ restaurantId }: { restaurantId: string }) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/receipts?restaurantId=${restaurantId}&limit=10`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch receipts');
        }

        const receipts = await response.json();

        if (!receipts.length) {
            return (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Receipts Yet</h3>
                        <p className="text-muted-foreground text-center">
                            Generated receipts will appear here
                        </p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receipts.map((receipt: any) => (
                    <Card key={receipt.id}>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">#{receipt.receipt_number}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(receipt.generated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Order #{receipt.receipt_data.order.order_number}
                                </div>
                                <div className="text-sm">
                                    ${receipt.receipt_data.summary.total_amount.toFixed(2)}
                                </div>
                                <div className="flex gap-1 pt-2">
                                    <button
                                        onClick={() => {
                                            // TODO: Implement print receipt logic
                                        }}
                                        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                                    >
                                        Print
                                    </button>
                                    <button
                                        onClick={() => {
                                            // TODO: Implement view receipt logic
                                        }}
                                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    } catch (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-red-500">Failed to load receipt history</p>
                </CardContent>
            </Card>
        );
    }
}
