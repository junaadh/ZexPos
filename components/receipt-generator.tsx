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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Printer,
    Download,
    Receipt as ReceiptIcon,
    CreditCard,
    Banknote,
    Smartphone,
    Calculator,
    Eye,
    ExternalLink,
} from 'lucide-react';
import { formatReceiptForPrint, printReceipt, downloadReceiptAsPDF } from '@/lib/receipt-utils';
import { toast } from 'sonner';
import type { Order, ReceiptData, ReceiptTemplate } from '@/lib/types';

interface ReceiptGeneratorProps {
    order: Order;
    onReceiptGenerated?: (receiptId: string) => void;
}

export function ReceiptGenerator({ order, onReceiptGenerated }: ReceiptGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [receipt, setReceipt] = useState<{ id: string; receipt_data: ReceiptData } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital_wallet'>('cash');
    const [amountTendered, setAmountTendered] = useState(order.total_amount.toString());
    const [showPreview, setShowPreview] = useState(false);

    const changeAmount = paymentMethod === 'cash'
        ? Math.max(0, parseFloat(amountTendered || '0') - order.total_amount)
        : 0;

    const handleGenerateReceipt = async () => {
        try {
            setIsGenerating(true);

            const paymentDetails = {
                method: paymentMethod,
                amount_tendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : order.total_amount,
                change_amount: changeAmount,
                payment_reference: paymentMethod !== 'cash' ? `TXN-${Date.now()}` : undefined,
            };

            const response = await fetch('/api/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id,
                    paymentDetails,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate receipt');
            }

            const newReceipt = await response.json();
            setReceipt(newReceipt);
            onReceiptGenerated?.(newReceipt.id);
            toast.success('Receipt generated successfully!');
        } catch (error) {
            console.error('Error generating receipt:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate receipt');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!receipt) return;

        try {
            const printContent = formatReceiptForPrint(receipt.receipt_data);
            printReceipt(printContent);
            toast.success('Receipt sent to printer!');
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

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Banknote className="h-4 w-4" />;
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'digital_wallet': return <Smartphone className="h-4 w-4" />;
            default: return <CreditCard className="h-4 w-4" />;
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ReceiptIcon className="h-5 w-5" />
                    Generate Receipt
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Order Summary */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Order #{order.order_number}</span>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                        </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Total Amount:</span>
                        <span className="font-medium">${order.total_amount.toFixed(2)}</span>
                    </div>
                </div>

                <Separator />

                {/* Payment Details */}
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
                        </div>
                    )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                    {!receipt ? (
                        <Button
                            onClick={handleGenerateReceipt}
                            disabled={isGenerating || order.payment_status !== 'paid'}
                            className="w-full"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Receipt'}
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <Button onClick={handleViewReceipt} className="w-full">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Receipt
                            </Button>
                            <div className="flex gap-2">
                                <Button onClick={handlePrintReceipt} variant="outline" className="flex-1">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                                <Button onClick={handleDownloadReceipt} variant="outline" className="flex-1">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>

                            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview Receipt
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md max-h-[80vh] overflow-auto">
                                    <DialogHeader>
                                        <DialogTitle>Receipt Preview</DialogTitle>
                                        <DialogDescription>
                                            Preview of the generated receipt
                                        </DialogDescription>
                                    </DialogHeader>
                                    <ReceiptPreview receiptData={receipt.receipt_data} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {order.payment_status !== 'paid' && (
                        <p className="text-sm text-muted-foreground text-center">
                            Order must be marked as paid before generating receipt
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface ReceiptPreviewProps {
    receiptData: ReceiptData;
}

function ReceiptPreview({ receiptData }: ReceiptPreviewProps) {
    const formattedReceipt = formatReceiptForPrint(receiptData);

    return (
        <div className="bg-white p-4 font-mono text-xs leading-tight border rounded">
            <pre className="whitespace-pre-wrap">{formattedReceipt}</pre>
        </div>
    );
}

export default ReceiptGenerator;
