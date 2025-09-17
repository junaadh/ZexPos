"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ReceiptViewer from "@/components/receipt-viewer";
import { Receipt, UserType } from "@/lib/types";
import { useRouter } from "next/navigation";

interface ReceiptViewerWrapperProps {
    receiptId: string;
    user: UserType;
}

export default function ReceiptViewerWrapper({ receiptId, user }: ReceiptViewerWrapperProps) {
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const response = await fetch(`/api/receipts?id=${receiptId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Receipt not found');
                    } else {
                        setError(`Failed to load receipt: ${response.statusText}`);
                    }
                    return;
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    setError('Invalid response from server');
                    return;
                }

                const receiptData = await response.json();

                if (receiptData.error) {
                    setError(receiptData.error);
                    return;
                }

                setReceipt(receiptData);
            } catch (err) {
                console.error('Error fetching receipt:', err);
                setError('Failed to load receipt');
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [receiptId]);

    if (loading) {
        return (
            <div className="flex h-screen">
                <AppSidebar user={user} restaurant={null} />
                <main className="flex-1 overflow-auto">
                    <div className="p-4">
                        <SidebarTrigger />
                    </div>
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Header Skeleton */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-10 w-20" />
                                    <div>
                                        <Skeleton className="h-8 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Skeleton className="h-10 w-24" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Receipt Content Skeleton */}
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

                                {/* Sidebar Skeleton */}
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
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen">
                <AppSidebar user={user} restaurant={null} />
                <main className="flex-1 overflow-auto">
                    <div className="p-4">
                        <SidebarTrigger />
                    </div>
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="max-w-4xl mx-auto">
                            <Card className="w-full max-w-md mx-auto mt-20">
                                <CardHeader>
                                    <CardTitle className="text-red-600">Error Loading Receipt</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-600">{error}</p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => router.back()}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                        >
                                            Go Back
                                        </button>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div className="flex h-screen">
                <AppSidebar user={user} restaurant={null} />
                <main className="flex-1 overflow-auto">
                    <div className="p-4">
                        <SidebarTrigger />
                    </div>
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="max-w-4xl mx-auto">
                            <Card className="w-full max-w-md mx-auto mt-20">
                                <CardHeader>
                                    <CardTitle>Receipt Not Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">The requested receipt could not be found.</p>
                                    <button
                                        onClick={() => router.back()}
                                        className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                    >
                                        Go Back
                                    </button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
    return (
        <div className="flex h-screen">
            <AppSidebar user={user} restaurant={null} />
            <main className="flex-1 overflow-auto">
                <div className="p-4">
                    <SidebarTrigger />
                </div>
                <ReceiptViewer receipt={receipt!} />
            </main>
        </div>
    );
}
