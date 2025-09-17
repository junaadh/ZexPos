"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CreditCard,
    Banknote,
    Smartphone,
    Calculator,
    Printer,
    Download,
    CheckCircle,
    Receipt as ReceiptIcon,
    ExternalLink,
} from 'lucide-react';
import { formatReceiptForPrint, printReceipt, downloadReceiptAsPDF } from '@/lib/receipt-utils';
import { toast } from 'sonner';
import type { Order } from '@/lib/types';

interface PaymentCompletionDialogProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onPaymentComplete: (orderId: string, receiptId: string) => void;
}

export function PaymentCompletionDialog({
    order,
    isOpen,
    onClose,
    onPaymentComplete
}: PaymentCompletionDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital_wallet'>('cash');
    const [amountTendered, setAmountTendered] = useState(order.total_amount.toString());
    const [isProcessing, setIsProcessing] = useState(false);
    const [receipt, setReceipt] = useState<any>(null);
    const [showReceiptOptions, setShowReceiptOptions] = useState(false);

    const changeAmount = paymentMethod === 'cash'
        ? Math.max(0, parseFloat(amountTendered || '0') - order.total_amount)
        : 0;

    const canProcessPayment = paymentMethod !== 'cash' || parseFloat(amountTendered || '0') >= order.total_amount;

    const handleProcessPayment = async () => {
        if (!canProcessPayment) {
            toast.error('Amount tendered must be greater than or equal to the total');
            return;
        }

        try {
            setIsProcessing(true);

            // 1. Update order status to paid
            const orderUpdateResponse = await fetch(`/api/orders?id=${order.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'served',
                    payment_status: 'paid',
                    payment_method: paymentMethod
                }),
            });

            if (!orderUpdateResponse.ok) {
                throw new Error('Failed to update order status');
            }

            // 2. Generate receipt
            const paymentDetails = {
                method: paymentMethod,
                amount_tendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : order.total_amount,
                change_amount: changeAmount,
                payment_reference: paymentMethod !== 'cash' ? `TXN-${Date.now()}` : undefined,
            };

            const receiptResponse = await fetch('/api/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id,
                    paymentDetails,
                }),
            });

            if (!receiptResponse.ok) {
                const error = await receiptResponse.json();
                throw new Error(error.error || 'Failed to generate receipt');
            }

            const newReceipt = await receiptResponse.json();
            setReceipt(newReceipt);
            setShowReceiptOptions(true);

            toast.success('Payment processed successfully!');
            onPaymentComplete(order.id, newReceipt.id);
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to process payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!receipt) return;

        try {
            const printContent = formatReceiptForPrint(receipt.receipt_data);
            printReceipt(printContent);
            toast.success('Receipt sent to printer!');
            handleComplete();
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to print receipt');
        }
    };

    const handleDownloadReceipt = () => {
        if (!receipt) return;

        try {
            const printContent = formatReceiptForPrint(receipt.receipt_data);
            downloadReceiptAsPDF(printContent, receipt.receipt_data.order.order_number.toString());
            toast.success('Receipt downloaded!');
        } catch (error) {
            console.error('Error downloading receipt:', error);
            toast.error('Failed to download receipt');
        }
    };

    const handleViewReceipt = () => {
        if (!receipt) return;

        try {
            const receiptUrl = `/receipts/${receipt.id}`;
            window.open(receiptUrl, '_blank');
            toast.success('Receipt opened in new tab!');
        } catch (error) {
            console.error('Error opening receipt:', error);
            toast.error('Failed to open receipt');
        }
    };

    const handleComplete = () => {
        setReceipt(null);
        setShowReceiptOptions(false);
        setPaymentMethod('cash');
        setAmountTendered(order.total_amount.toString());
        onClose();
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Banknote className="h-4 w-4" />;
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'digital_wallet': return <Smartphone className="h-4 w-4" />;
            default: return <CreditCard className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {showReceiptOptions ? (
                            <>
                                <ReceiptIcon className="h-5 w-5" />
                                Receipt Generated
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-5 w-5" />
                                Complete Payment
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {showReceiptOptions
                            ? 'Payment processed successfully. Choose how to handle the receipt.'
                            : `Process payment for Order #${order.order_number}`
                        }
                    </DialogDescription>
                </DialogHeader>

                {!showReceiptOptions ? (
                    <div className="space-y-4">
                        {/* Order Summary */}
                        <Card>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Order #{order.order_number}</span>
                                        <Badge>{order.status}</Badge>
                                    </div>
                                    {order.restaurant_tables && (
                                        <div className="flex justify-between text-sm">
                                            <span>Table:</span>
                                            <span>{order.restaurant_tables.table_name || `Table ${order.restaurant_tables.table_number}`}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span>Items:</span>
                                        <span>{order.order_items?.length || 0} items</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-medium">
                                        <span>Total:</span>
                                        <span>${order.total_amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-4 w-4" />
                                            Cash
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="card">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Card
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="digital_wallet">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4" />
                                            Digital Wallet
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {paymentMethod === 'cash' && (
                                <div className="space-y-2">
                                    <Label htmlFor="amount-tendered">Amount Tendered</Label>
                                    <Input
                                        id="amount-tendered"
                                        type="number"
                                        step="0.01"
                                        min={order.total_amount}
                                        value={amountTendered}
                                        onChange={(e) => setAmountTendered(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {changeAmount > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <Calculator className="h-4 w-4" />
                                            Change: ${changeAmount.toFixed(2)}
                                        </div>
                                    )}
                                    {!canProcessPayment && (
                                        <p className="text-sm text-red-500">
                                            Amount must be at least ${order.total_amount.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Payment Success */}
                        <div className="flex flex-col items-center text-center space-y-2">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <h3 className="text-lg font-medium">Payment Completed!</h3>
                            <p className="text-sm text-muted-foreground">
                                Receipt has been generated and is ready for printing or download.
                            </p>
                        </div>

                        {/* Receipt Actions */}
                        <div className="space-y-2">
                            <Button onClick={handleViewReceipt} className="w-full">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Receipt
                            </Button>
                            <Button onClick={handlePrintReceipt} variant="outline" className="w-full">
                                <Printer className="h-4 w-4 mr-2" />
                                Print Receipt
                            </Button>
                            <Button onClick={handleDownloadReceipt} variant="outline" className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Download Receipt
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!showReceiptOptions ? (
                        <>
                            <Button onClick={onClose} variant="outline">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleProcessPayment}
                                disabled={isProcessing || !canProcessPayment}
                            >
                                {isProcessing ? 'Processing...' : 'Process Payment'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleComplete} className="w-full">
                            Complete Order
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PaymentCompletionDialog;
