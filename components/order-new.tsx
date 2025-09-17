"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getRestaurant } from "@/lib/database";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import OrderManagement from "@/components/order-management";
import { UserType, Restaurant } from "@/lib/types";

export default function OrderPage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const { user: currentUser, error } = await getCurrentUser();
                if (error || !currentUser) {
                    router.push('/auth/login');
                    return;
                }

                setUser(currentUser);

                if (currentUser.restaurant_id) {
                    const restaurantData = await getRestaurant(currentUser.restaurant_id);
                    if (restaurantData.data) {
                        setRestaurant(restaurantData.data);
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                router.push('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Skeleton */}
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>

                    {/* Quick Stats Skeleton */}
                    <div className="grid gap-4 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-16" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border rounded">
                                                <div className="flex items-center space-x-4">
                                                    <Skeleton className="h-10 w-10" />
                                                    <div>
                                                        <Skeleton className="h-4 w-32 mb-2" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Skeleton className="h-8 w-20" />
                                                    <Skeleton className="h-8 w-8" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-4">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <OrderManagement user={user} restaurant={restaurant} />;
}
