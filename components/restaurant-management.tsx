"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Edit, MapPin, Phone, Mail, Globe } from "lucide-react"
import Link from "next/link"
import type { Restaurant, UserType } from "@/lib/types"

interface RestaurantManagementProps {
    user: UserType
    restaurant: Restaurant | null
}

export function RestaurantManagement({ user, restaurant }: RestaurantManagementProps) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadRestaurants = async () => {
            setLoading(true)
            try {
                let accessibleRestaurants: Restaurant[] = []

                if (user.role === 'super_admin') {
                    // Super admin can see all restaurants
                    const response = await fetch('/api/admin/restaurants')
                    const data = await response.json()
                    accessibleRestaurants = data.restaurants || []
                } else if (user.role === 'org_admin' && user.organization_id) {
                    // Org admin can only see their organization's restaurants
                    const response = await fetch('/api/org/restaurants')
                    const data = await response.json()
                    accessibleRestaurants = data.restaurants || []
                } else {
                    // Other roles - get their specific restaurant
                    const response = await fetch('/api/user/restaurants')
                    const data = await response.json()
                    accessibleRestaurants = data.restaurants || []
                }

                setRestaurants(accessibleRestaurants)
            } catch (error) {
                console.error("Error loading restaurants:", error)
            } finally {
                setLoading(false)
            }
        }
        loadRestaurants()
    }, [user.id, user.role, user.organization_id])

    const canAddRestaurant = user.role === 'super_admin' || user.role === 'org_admin'

    return (
        <div className="flex w-screen h-screen">
            <AppSidebar user={user} restaurant={restaurant} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
                    <SidebarTrigger />
                    <div className="flex flex-1 items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">
                                Restaurants
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {user.role === 'super_admin'
                                    ? 'Manage all restaurant locations across organizations'
                                    : user.role === 'org_admin'
                                        ? 'Manage your organization\'s restaurant locations'
                                        : 'View your assigned restaurant location'
                                }
                            </p>
                        </div>
                        {canAddRestaurant && (
                            <Link href="/restaurants/add">
                                <Button key="restaurant-management-add-button">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Restaurant
                                </Button>
                            </Link>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded"></div>
                                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : restaurants.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Building2 className="h-16 w-16 text-muted-foreground mb-6" />
                                    <h3 className="text-xl font-semibold mb-2">
                                        {canAddRestaurant ? 'No Restaurants Yet' : 'No Restaurant Access'}
                                    </h3>
                                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                                        {canAddRestaurant
                                            ? 'Get started by creating your first restaurant location.'
                                            : 'You don\'t have access to any restaurants. Contact your administrator.'
                                        }
                                    </p>
                                    {canAddRestaurant && (
                                        <Link href="/restaurants/add">
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Your First Restaurant
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {restaurants.map((rest) => (
                                    <Card key={rest.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Building2 className="h-5 w-5" />
                                                        {rest.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant={rest.is_active ? "default" : "secondary"}>
                                                            {rest.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {rest.currency || 'USD'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {(user.role === 'super_admin' || user.role === 'org_admin') && (
                                                    <Link href={`/restaurants/${rest.id}/edit`}>
                                                        <Button size="sm" variant="ghost">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <span className="text-muted-foreground">{rest.address}</span>
                                                </div>
                                                {rest.phone && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">{rest.phone}</span>
                                                    </div>
                                                )}
                                                {rest.email && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">{rest.email}</span>
                                                    </div>
                                                )}
                                                {rest.timezone && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">{rest.timezone}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center pt-3 border-t">
                                                    <span className="text-xs text-muted-foreground">
                                                        Created {new Date(rest.created_at).toLocaleDateString()}
                                                    </span>
                                                    <Link href={`/restaurants/${rest.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
