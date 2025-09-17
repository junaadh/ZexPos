"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getOrganizations } from "@/lib/handlers/organizations"
import type { Restaurant, UserType, Organization } from "@/lib/types"

interface EditRestaurantProps {
    user: UserType
    restaurant: Restaurant
}

export function EditRestaurant({ user, restaurant }: EditRestaurantProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [formData, setFormData] = useState({
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        organization_id: restaurant.organization_id,
        timezone: restaurant.timezone || "UTC",
        currency: restaurant.currency || "USD",
        is_active: restaurant.is_active
    })

    useEffect(() => {
        // Load organizations for super admins
        const loadOrganizations = async () => {
            if (user.role === 'super_admin') {
                const orgs = await getOrganizations()
                setOrganizations(orgs)
            }
        }
        loadOrganizations()
    }, [user.role])

    // Check if user can edit this restaurant
    const canEdit = user.role === 'super_admin' ||
        (user.role === 'org_admin' && user.organization_id === restaurant.organization_id)

    if (!canEdit) {
        return (
            <div className="flex w-screen h-screen">
                <AppSidebar user={user} restaurant={restaurant} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground mb-4">You don't have permission to edit this restaurant.</p>
                        <Link href="/restaurants">
                            <Button>Back to Restaurants</Button>
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.address.trim() || !formData.organization_id) {
            toast.error("Restaurant name, address, and organization are required.")
            return
        }

        // Additional permission check
        if (user.role === 'org_admin' && user.organization_id !== formData.organization_id) {
            toast.error("You can only edit restaurants in your organization.")
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from("restaurants")
                .update({
                    name: formData.name.trim(),
                    address: formData.address.trim(),
                    phone: formData.phone.trim() || null,
                    email: formData.email.trim() || null,
                    organization_id: formData.organization_id,
                    timezone: formData.timezone,
                    currency: formData.currency,
                    is_active: formData.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", restaurant.id)

            if (error) {
                throw error
            }

            toast.success("Restaurant has been updated successfully.")
            router.push(`/restaurants/${restaurant.id}`)
        } catch (error) {
            console.error("Error updating restaurant:", error)
            toast.error("Failed to update restaurant. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex w-screen h-screen">
            <AppSidebar user={user} restaurant={restaurant} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
                    <SidebarTrigger />
                    <div className="flex flex-1 items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">
                                Edit Restaurant
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update restaurant information
                            </p>
                        </div>
                        <Link href={`/restaurants/${restaurant.id}`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Restaurant
                            </Button>
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Restaurant Information
                                </CardTitle>
                                <CardDescription>
                                    Update the information for this restaurant location
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {user.role === 'super_admin' && (
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="organization_id">Organization *</Label>
                                                <Select
                                                    value={formData.organization_id}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                                                    disabled={loading}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select organization" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {organizations.map((org) => (
                                                            <SelectItem key={org.id} value={org.id}>
                                                                {org.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="name">Restaurant Name *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                placeholder="Enter restaurant name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                className="text-lg"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="address">Address *</Label>
                                            <Textarea
                                                id="address"
                                                name="address"
                                                placeholder="Enter complete address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="Enter phone number"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="Enter email address"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select
                                                value={formData.timezone}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                                                disabled={loading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC</SelectItem>
                                                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                                                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Select
                                                value={formData.currency}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                                                disabled={loading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2 flex items-center space-x-2">
                                            <Switch
                                                id="is_active"
                                                checked={formData.is_active}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                                disabled={loading}
                                            />
                                            <Label htmlFor="is_active">Restaurant is active</Label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1"
                                        >
                                            {loading ? "Updating..." : "Update Restaurant"}
                                        </Button>
                                        <Link href={`/restaurants/${restaurant.id}`} className="flex-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={loading}
                                                className="w-full"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
