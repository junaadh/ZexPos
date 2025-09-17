"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Printer,
    Download,
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User
} from "lucide-react";
import { Receipt } from "@/lib/types";
import { formatReceiptForPrint, printReceipt, downloadReceiptAsPDF } from "@/lib/receipt-utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReceiptViewerProps {
    receipt: Receipt;
}

export default function ReceiptViewer({ receipt }: ReceiptViewerProps) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const router = useRouter();

    const receiptData = receipt.receipt_data;

    const handlePrint = async () => {
        if (!receipt) return;

        setIsPrinting(true);
        try {
            const printContent = formatReceiptForPrint(receiptData);
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
            const printContent = formatReceiptForPrint(receiptData);
            await downloadReceiptAsPDF(printContent, receiptData.order.order_number.toString());
            toast.success('Receipt downloaded!');
        } catch (error) {
            console.error('Error downloading receipt:', error);
            toast.error('Failed to download receipt');
        } finally {
            setIsDownloading(false);
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
                            <h1 className="text-2xl font-bold">Receipt #{receipt.receipt_number}</h1>
                            <p className="text-gray-600">Order #{receiptData.order.order_number}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            disabled={isPrinting}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            {isPrinting ? 'Printing...' : 'Print'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Receipt Preview */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Receipt Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Restaurant Header */}
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold">{receiptData.restaurant.name}</h2>
                                    {receiptData.restaurant.address && (
                                        <p className="text-gray-600">{receiptData.restaurant.address}</p>
                                    )}
                                    {receiptData.restaurant.phone && (
                                        <p className="text-gray-600">{receiptData.restaurant.phone}</p>
                                    )}
                                </div>

                                <Separator className="my-4" />

                                {/* Order Info */}
                                <div className="flex justify-between text-sm mb-4">
                                    <div>
                                        <p><strong>Order #:</strong> {receiptData.order.order_number}</p>
                                        <p><strong>Table:</strong> {receiptData.order.table_number || 'N/A'}</p>
                                        <p><strong>Type:</strong> {receiptData.order.order_type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p><strong>Date:</strong> {formatDate(receiptData.order.created_at)}</p>
                                        <Badge variant="secondary">{receipt.receipt_type}</Badge>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                {/* Items */}
                                <div className="space-y-2">
                                    {receiptData.items.map((item, index) => (
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
                                        <span>{formatCurrency(receiptData.summary.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>{formatCurrency(receiptData.summary.tax_amount)}</span>
                                    </div>
                                    {receiptData.summary.discount_amount > 0 && (
                                        <div className="flex justify-between">
                                            <span>Discount:</span>
                                            <span>-{formatCurrency(receiptData.summary.discount_amount)}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span>{formatCurrency(receiptData.summary.total_amount)}</span>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                {/* Payment Info */}
                                <div className="text-center text-sm text-gray-600">
                                    <p>Payment Method: {receiptData.payment.method}</p>
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
                                        <p className="text-sm text-gray-600">{formatDate(receiptData.order.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium">Restaurant</p>
                                        <p className="text-sm text-gray-600">{receiptData.restaurant.name}</p>
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
            </div>
        </div>
    );
}
