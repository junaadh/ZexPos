"use client";

import React, { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    Printer,
    Download,
    Calendar,
    Clock,
    MapPin,
    User,
    ExternalLink
} from "lucide-react";
import { Receipt } from "@/lib/types";
import { formatReceiptForPrint, printReceipt, downloadReceiptAsPDF } from "@/lib/receipt-utils";
import { toast } from "sonner";

interface ReceiptModalProps {
    receiptId: string | null;
    open: boolean;
    onClose: () => void;
}

export default function ReceiptModal({ receiptId, open, onClose }: ReceiptModalProps) {
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch receipt when modal opens and receiptId changes
    React.useEffect(() => {
        if (open && receiptId) {
            fetchReceipt();
        }
    }, [open, receiptId]);

    const fetchReceipt = async () => {
        if (!receiptId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/receipts?id=${receiptId}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch receipt: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response from server');
            }

            const receiptData = await response.json();

            if (receiptData.error) {
                throw new Error(receiptData.error);
            }

            setReceipt(receiptData);
        } catch (error) {
            console.error('Error fetching receipt:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load receipt');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!receipt) return;

        setIsPrinting(true);
        try {
            const printContent = formatReceiptForPrint(receipt.receipt_data);
            await printReceipt(printContent);
            toast.success('Receipt sent to printer!');
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to print receipt');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleDownload = async () => {
        if (!receipt) return;

        setIsDownloading(true);
        try {
            const printContent = formatReceiptForPrint(receipt.receipt_data);
            await downloadReceiptAsPDF(printContent, receipt.receipt_data.order.order_number.toString());
            toast.success('Receipt downloaded!');
        } catch (error) {
            console.error('Error downloading receipt:', error);
            toast.error('Failed to download receipt');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleOpenInNewTab = () => {
        if (receiptId) {
            window.open(`/receipts/${receiptId}`, '_blank');
        }
    };

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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="min-w-[50vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {loading ? (
                            "Loading Receipt..."
                        ) : receipt ? (
                            `Receipt #${receipt.receipt_number}`
                        ) : (
                            "Receipt"
                        )}
                    </DialogTitle>
                    <div className="flex items-center justify-between">
                        <div>
                            {loading ? (
                                <Skeleton className="h-5 w-48" />
                            ) : receipt ? (
                                <p className="text-sm text-gray-600 mt-1">
                                    Order #{receipt.receipt_data.order.order_number} • {formatDate(receipt.generated_at)}
                                </p>
                            ) : null}
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenInNewTab}
                                disabled={!receiptId}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in Tab
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                disabled={!receipt || isPrinting}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {isPrinting ? 'Printing...' : 'Print'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={!receipt || isDownloading}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isDownloading ? 'Downloading...' : 'Download PDF'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-6 mt-4">
                        {/* Loading Skeleton */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <Skeleton className="h-6 w-32" />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-px w-full" />
                                        <Skeleton className="h-6 w-48" />
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card>
                                    <CardHeader>
                                        <Skeleton className="h-6 w-32" />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                ) : receipt ? (
                    <div className="grid gap-6 lg:grid-cols-3 mt-4">
                        {/* Receipt Preview */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Receipt Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Restaurant Header */}
                                    <div className="text-center mb-6">
                                        <h2 className="text-xl font-bold">{receipt.receipt_data.restaurant.name}</h2>
                                        {receipt.receipt_data.restaurant.address && (
                                            <p className="text-gray-600">{receipt.receipt_data.restaurant.address}</p>
                                        )}
                                        {receipt.receipt_data.restaurant.phone && (
                                            <p className="text-gray-600">{receipt.receipt_data.restaurant.phone}</p>
                                        )}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Order Info */}
                                    <div className="flex justify-between text-sm mb-4">
                                        <div>
                                            <p><strong>Order #:</strong> {receipt.receipt_data.order.order_number}</p>
                                            <p><strong>Table:</strong> {receipt.receipt_data.order.table_number || 'N/A'}</p>
                                            <p><strong>Type:</strong> {receipt.receipt_data.order.order_type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p><strong>Date:</strong> {formatDate(receipt.receipt_data.order.created_at)}</p>
                                            <Badge variant="secondary">{receipt.receipt_type}</Badge>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Items */}
                                    <div className="space-y-2">
                                        {receipt.receipt_data.items.map((item, index) => (
                                            <div key={index} className="flex justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.name}</p>
                                                    {item.special_instructions && (
                                                        <p className="text-sm text-gray-600">Note: {item.special_instructions}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p>{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Totals */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(receipt.receipt_data.summary.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tax:</span>
                                            <span>{formatCurrency(receipt.receipt_data.summary.tax_amount)}</span>
                                        </div>
                                        {receipt.receipt_data.summary.discount_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span>Discount:</span>
                                                <span>-{formatCurrency(receipt.receipt_data.summary.discount_amount)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>{formatCurrency(receipt.receipt_data.summary.total_amount)}</span>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Payment Info */}
                                    <div className="text-center text-sm text-gray-600">
                                        <p>Payment Method: {receipt.receipt_data.payment.method}</p>
                                        <p>Thank you for your business!</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Receipt Details */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Receipt Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium">Generated</p>
                                            <p className="text-sm text-gray-600">{formatDate(receipt.generated_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium">Order Created</p>
                                            <p className="text-sm text-gray-600">{formatDate(receipt.receipt_data.order.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium">Restaurant</p>
                                            <p className="text-sm text-gray-600">{receipt.receipt_data.restaurant.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium">Receipt Type</p>
                                            <Badge variant="outline">{receipt.receipt_type}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Failed to load receipt</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
