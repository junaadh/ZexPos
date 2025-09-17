"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, Phone, MapPin, Calendar, Mail, Globe, DollarSign, Edit } from "lucide-react"
import Link from "next/link"
import { getOrganizationById } from "@/lib/handlers/organizations"
import type { Restaurant, UserType, Organization } from "@/lib/types"

interface RestaurantDetailsProps {
    user: UserType
    restaurant: Restaurant
}

export function RestaurantDetails({ user, restaurant }: RestaurantDetailsProps) {
    console.log("RestaurantDetails render", restaurant);

    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadOrganization = async () => {
            if (restaurant.organization_id) {
                const org = await getOrganizationById(restaurant.organization_id)
                setOrganization(org)
            }
            setLoading(false)
        }
        loadOrganization()
    }, [restaurant.organization_id])

    const canEdit = user.role === 'super_admin' ||
        (user.role === 'org_admin' && user.organization_id === restaurant.organization_id)

    return (
        <div className="flex w-screen h-screen">
            <AppSidebar user={user} restaurant={restaurant} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
                    <SidebarTrigger />
                    <div className="flex flex-1 items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">
                                {restaurant.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Restaurant details and information
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/restaurants">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Restaurants
                                </Button>
                            </Link>
                            {canEdit && (
                                <Link href={`/restaurants/${restaurant.id}/edit`}>
                                    <Button>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Restaurant
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Restaurant Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Restaurant Information
                                </CardTitle>
                                <CardDescription>
                                    Basic details and contact information for this restaurant location
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Restaurant Name</h4>
                                            <p className="text-lg font-semibold">{restaurant.name}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Address</h4>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                                <p className="text-sm">{restaurant.address}</p>
                                            </div>
                                        </div>

                                        {restaurant.phone && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Phone</h4>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-sm">{restaurant.phone}</p>
                                                </div>
                                            </div>
                                        )}

                                        {restaurant.email && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Email</h4>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-sm">{restaurant.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                                            <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                                                {restaurant.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>

                                        {restaurant.timezone && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Timezone</h4>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-sm">{restaurant.timezone}</p>
                                                </div>
                                            </div>
                                        )}

                                        {restaurant.currency && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Currency</h4>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-sm">{restaurant.currency}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Created</h4>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm">{new Date(restaurant.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organization Information Card */}
                        {organization && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organization</CardTitle>
                                    <CardDescription>
                                        This restaurant belongs to the following organization
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Organization Name</h4>
                                            <p className="font-semibold">{organization.name}</p>
                                        </div>
                                        {organization.description && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                                                <p className="text-sm">{organization.description}</p>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Subscription Plan</h4>
                                            <Badge variant="outline">{organization.subscription_plan}</Badge>
                                        </div>
                                        {organization.contact_email && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Email</h4>
                                                <p className="text-sm">{organization.contact_email}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>
                                    Common actions for this restaurant
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <Link href={`/menu?restaurant=${restaurant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            Manage Menu
                                        </Button>
                                    </Link>
                                    <Link href={`/tables?restaurant=${restaurant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            Manage Tables
                                        </Button>
                                    </Link>
                                    <Link href={`/orders?restaurant=${restaurant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            View Orders
                                        </Button>
                                    </Link>
                                    <Link href={`/analytics?restaurant=${restaurant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            View Analytics
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
