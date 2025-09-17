"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Building2, Users, Settings, Trash2, Edit, UserPlus, Store } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Organization, UserType, Restaurant, Staff } from "@/lib/types"
import { toast } from "sonner"

interface AdminDashboardProps {
    user: UserType
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [staff, setStaff] = useState<Staff[]>([])
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("organizations")

    // Dialog states
    const [orgDialogOpen, setOrgDialogOpen] = useState(false)
    const [staffDialogOpen, setStaffDialogOpen] = useState(false)
    const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false)

    // Edit states
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)

    // Form states
    const [newOrg, setNewOrg] = useState({
        name: "",
        description: "",
        contact_email: "",
        contact_phone: "",
        billing_address: "",
        subscription_plan: "basic" as "basic" | "premium" | "enterprise",
        is_active: true
    })

    const [newStaff, setNewStaff] = useState({
        organization_id: "",
        restaurant_id: "none",
        full_name: "",
        email: "",
        password: "",
        role: "server" as "super_admin" | "org_admin" | "manager" | "server" | "kitchen" | "cashier",
        phone: "",
        hire_date: new Date().toISOString().split('T')[0],
        hourly_rate: 0,
        permissions: [] as string[],
        is_active: true
    })

    const [newRestaurant, setNewRestaurant] = useState({
        organization_id: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        timezone: "UTC",
        currency: "USD",
        is_active: true
    })

    // Check permissions
    if (user.role !== 'super_admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Access denied. Super admin privileges required.</p>
            </div>
        )
    }

    // Load data on mount
    useEffect(() => {
        loadOrganizations()
        loadStaff()
    }, [])

    // Load restaurants when organization is selected
    useEffect(() => {
        if (selectedOrganization) {
            loadRestaurants(selectedOrganization.id)
        } else {
            setRestaurants([])
            setSelectedRestaurant(null)
        }
    }, [selectedOrganization])

    const loadOrganizations = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/organizations')

            if (!response.ok) {
                throw new Error('Failed to fetch organizations')
            }

            const data = await response.json()
            setOrganizations(data.organizations || data || [])
        } catch (error) {
            console.error('Error loading organizations:', error)
            toast.error("Failed to load organizations")
        } finally {
            setLoading(false)
        }
    }

    const loadRestaurants = async (orgId?: string) => {
        try {
            const url = orgId ? `/api/admin/restaurants?org_id=${orgId}` : '/api/admin/restaurants'
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Failed to fetch restaurants')
            }

            const data = await response.json()
            setRestaurants(data.restaurants || data || [])
        } catch (error) {
            console.error('Error loading restaurants:', error)
            toast.error("Failed to load restaurants")
        }
    }

    const loadStaff = async (orgId?: string) => {
        try {
            const url = orgId ? `/api/admin/staff?org_id=${orgId}` : '/api/admin/staff'
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Failed to fetch staff')
            }

            const data = await response.json()
            setStaff(data.staff || data || [])
        } catch (error) {
            console.error('Error loading staff:', error)
            toast.error("Failed to load staff")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newOrg.name.trim()) {
            toast.error("Organization name is required")
            return
        }

        try {
            const url = editingOrg
                ? `/api/admin/organizations/${editingOrg.id}`
                : '/api/admin/organizations'

            const method = editingOrg ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newOrg),
            })

            if (!response.ok) {
                throw new Error(`Failed to ${editingOrg ? 'update' : 'create'} organization`)
            }

            const data = await response.json()
            const savedOrg = data.organization || data

            if (editingOrg) {
                setOrganizations(orgs =>
                    orgs.map(org => org.id === editingOrg.id ? savedOrg : org)
                )
                toast.success("Organization updated successfully")
            } else {
                setOrganizations(orgs => [savedOrg, ...orgs])
                toast.success("Organization created successfully")
            }

            resetOrgForm()
            setOrgDialogOpen(false)
        } catch (error) {
            console.error('Error saving organization:', error)
            toast.error(`Failed to ${editingOrg ? 'update' : 'create'} organization`)
        }
    }

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newStaff.full_name.trim() || !newStaff.organization_id) {
            toast.error("Staff name and organization are required")
            return
        }

        if (!editingStaff && (!newStaff.email.trim() || !newStaff.password.trim())) {
            toast.error("Email and password are required for new staff")
            return
        }

        try {
            const url = editingStaff
                ? `/api/admin/staff/${editingStaff.id}`
                : '/api/admin/staff'

            const method = editingStaff ? 'PUT' : 'POST'

            // Prepare data for API, converting "none" to undefined for restaurant_id
            const staffData = {
                name: newStaff.full_name, // Map full_name to name for API
                email: newStaff.email,
                role: newStaff.role,
                organization_id: newStaff.organization_id,
                restaurant_id: newStaff.restaurant_id === "none" ? undefined : newStaff.restaurant_id,
                phone: newStaff.phone,
                hire_date: newStaff.hire_date,
                hourly_rate: newStaff.hourly_rate,
                is_active: newStaff.is_active,
                ...(newStaff.password && { password: newStaff.password }) // Only include password if provided
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(staffData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to ${editingStaff ? 'update' : 'create'} staff`)
            }

            const data = await response.json()
            const savedStaff = data.staff || data

            if (editingStaff) {
                setStaff(staff =>
                    staff.map(s => s.id === editingStaff.id ? savedStaff : s)
                )
                toast.success("Staff updated successfully")
            } else {
                setStaff(staff => [savedStaff, ...staff])
                toast.success("Staff created successfully")
            }

            resetStaffForm()
            setStaffDialogOpen(false)
        } catch (error) {
            console.error('Error saving staff:', error)
            toast.error(`Failed to ${editingStaff ? 'update' : 'create'} staff`)
        }
    }

    const handleRestaurantSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newRestaurant.name.trim() || !newRestaurant.organization_id) {
            toast.error("Restaurant name and organization are required")
            return
        }

        try {
            const url = editingRestaurant
                ? `/api/admin/restaurants/${editingRestaurant.id}`
                : '/api/admin/restaurants'

            const method = editingRestaurant ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRestaurant),
            })

            if (!response.ok) {
                throw new Error(`Failed to ${editingRestaurant ? 'update' : 'create'} restaurant`)
            }

            const data = await response.json()
            const savedRestaurant = data.restaurant || data

            if (editingRestaurant) {
                setRestaurants(restaurants =>
                    restaurants.map(r => r.id === editingRestaurant.id ? savedRestaurant : r)
                )
                toast.success("Restaurant updated successfully")
            } else {
                setRestaurants(restaurants => [savedRestaurant, ...restaurants])
                toast.success("Restaurant created successfully")
            }

            resetRestaurantForm()
            setRestaurantDialogOpen(false)
        } catch (error) {
            console.error('Error saving restaurant:', error)
            toast.error(`Failed to ${editingRestaurant ? 'update' : 'create'} restaurant`)
        }
    }

    const handleEdit = (org: Organization) => {
        setEditingOrg(org)
        setNewOrg({
            name: org.name,
            description: org.description || "",
            contact_email: org.contact_email || "",
            contact_phone: org.contact_phone || "",
            billing_address: org.billing_address || "",
            subscription_plan: org.subscription_plan || "basic",
            is_active: org.is_active
        })
        setOrgDialogOpen(true)
    }

    const handleEditStaff = (staffMember: Staff) => {
        setEditingStaff(staffMember)
        setNewStaff({
            organization_id: staffMember.organization_id || "",
            restaurant_id: staffMember.restaurant_id || "none",
            full_name: staffMember.full_name || "",
            email: staffMember.email || "",
            password: "", // Don't pre-fill password for editing
            role: staffMember.role,
            phone: staffMember.phone || "",
            hire_date: staffMember.hire_date || new Date().toISOString().split('T')[0],
            hourly_rate: staffMember.hourly_rate || 0,
            permissions: staffMember.permissions || [],
            is_active: staffMember.is_active
        })
        setStaffDialogOpen(true)
    }

    const handleEditRestaurant = (restaurant: Restaurant) => {
        setEditingRestaurant(restaurant)
        setNewRestaurant({
            organization_id: restaurant.organization_id,
            name: restaurant.name,
            address: restaurant.address,
            phone: restaurant.phone || "",
            email: restaurant.email || "",
            timezone: restaurant.timezone || "UTC",
            currency: restaurant.currency || "USD",
            is_active: restaurant.is_active
        })
        setRestaurantDialogOpen(true)
    }

    const handleDelete = async (orgId: string) => {
        if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
            return
        }

        try {
            const response = await fetch(`/api/admin/organizations/${orgId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete organization')
            }

            setOrganizations(orgs => orgs.filter(org => org.id !== orgId))
            toast.success("Organization deleted successfully")
        } catch (error) {
            console.error('Error deleting organization:', error)
            toast.error("Failed to delete organization")
        }
    }

    const handleDeleteStaff = async (staffId: string) => {
        if (!confirm("Are you sure you want to delete this staff member?")) {
            return
        }

        try {
            const response = await fetch(`/api/admin/staff/${staffId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete staff')
            }

            setStaff(staff => staff.filter(s => s.id !== staffId))
            toast.success("Staff deleted successfully")
        } catch (error) {
            console.error('Error deleting staff:', error)
            toast.error("Failed to delete staff")
        }
    }

    const handleDeleteRestaurant = async (restaurantId: string) => {
        if (!confirm("Are you sure you want to delete this restaurant?")) {
            return
        }

        try {
            const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete restaurant')
            }

            setRestaurants(restaurants => restaurants.filter(r => r.id !== restaurantId))
            toast.success("Restaurant deleted successfully")
        } catch (error) {
            console.error('Error deleting restaurant:', error)
            toast.error("Failed to delete restaurant")
        }
    }

    const resetOrgForm = () => {
        setNewOrg({
            name: "",
            description: "",
            contact_email: "",
            contact_phone: "",
            billing_address: "",
            subscription_plan: "basic",
            is_active: true
        })
        setEditingOrg(null)
    }

    const resetStaffForm = () => {
        setNewStaff({
            organization_id: "",
            restaurant_id: "none",
            full_name: "",
            email: "",
            password: "",
            role: "server",
            phone: "",
            hire_date: new Date().toISOString().split('T')[0],
            hourly_rate: 0,
            permissions: [],
            is_active: true
        })
        setEditingStaff(null)
    }

    const resetRestaurantForm = () => {
        setNewRestaurant({
            organization_id: "",
            name: "",
            address: "",
            phone: "",
            email: "",
            timezone: "UTC",
            currency: "USD",
            is_active: true
        })
        setEditingRestaurant(null)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-7 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs Skeleton */}
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-24" />
                        ))}
                    </div>

                    {/* Table Content Skeleton */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="h-10 w-10" />
                                            <div>
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Skeleton className="h-6 w-20" />
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">
                        Manage organizations, restaurants, staff, and system-wide settings
                    </p>
                </div>
            </div>

            {/* Organization and Restaurant Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="org-selector">Organization Filter</Label>
                    <Select
                        value={selectedOrganization?.id || "all"}
                        onValueChange={(value) => {
                            if (value === "all") {
                                setSelectedOrganization(null)
                                loadStaff()
                                loadRestaurants()
                            } else {
                                const org = organizations.find(o => o.id === value)
                                setSelectedOrganization(org || null)
                                loadStaff(value)
                                loadRestaurants(value)
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Organizations</SelectItem>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="restaurant-selector">Restaurant Filter</Label>
                    <Select
                        value={selectedRestaurant?.id || "all"}
                        onValueChange={(value) => {
                            if (value === "all") {
                                setSelectedRestaurant(null)
                            } else {
                                const restaurant = restaurants.find(r => r.id === value)
                                setSelectedRestaurant(restaurant || null)
                            }
                        }}
                        disabled={!selectedOrganization}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Restaurants</SelectItem>
                            {restaurants.map((restaurant) => (
                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                    {restaurant.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="organizations" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Organizations
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Staff
                    </TabsTrigger>
                    <TabsTrigger value="restaurants" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Restaurants
                    </TabsTrigger>
                </TabsList>

                {/* Organizations Tab */}
                <TabsContent value="organizations" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Organizations</h3>
                        <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => resetOrgForm()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Organization
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingOrg ? "Edit Organization" : "Create New Organization"}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Organization Name *</Label>
                                        <Input
                                            id="name"
                                            value={newOrg.name}
                                            onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter organization name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={newOrg.description}
                                            onChange={(e) => setNewOrg(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Enter organization description"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="contact_email">Contact Email</Label>
                                            <Input
                                                id="contact_email"
                                                type="email"
                                                value={newOrg.contact_email}
                                                onChange={(e) => setNewOrg(prev => ({ ...prev, contact_email: e.target.value }))}
                                                placeholder="contact@organization.com"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="contact_phone">Contact Phone</Label>
                                            <Input
                                                id="contact_phone"
                                                value={newOrg.contact_phone}
                                                onChange={(e) => setNewOrg(prev => ({ ...prev, contact_phone: e.target.value }))}
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="billing_address">Billing Address</Label>
                                        <Textarea
                                            id="billing_address"
                                            value={newOrg.billing_address}
                                            onChange={(e) => setNewOrg(prev => ({ ...prev, billing_address: e.target.value }))}
                                            placeholder="Enter billing address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="subscription_plan">Subscription Plan</Label>
                                            <Select
                                                value={newOrg.subscription_plan}
                                                onValueChange={(value: "basic" | "premium" | "enterprise") =>
                                                    setNewOrg(prev => ({ ...prev, subscription_plan: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="basic">Basic</SelectItem>
                                                    <SelectItem value="premium">Premium</SelectItem>
                                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="is_active"
                                                checked={newOrg.is_active}
                                                onCheckedChange={(checked) => setNewOrg(prev => ({ ...prev, is_active: checked }))}
                                            />
                                            <Label htmlFor="is_active">Active</Label>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-1">
                                            {editingOrg ? "Update Organization" : "Create Organization"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOrgDialogOpen(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Organizations Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {organizations.length === 0 ? (
                            <Card className="col-span-full">
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                        Get started by creating your first organization.
                                    </p>
                                    <Button onClick={() => setOrgDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Organization
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            organizations.map((org) => (
                                <Card key={org.id} className="relative">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-lg">{org.name}</CardTitle>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(org)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(org.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="text-sm">
                                            {org.description || "No description provided"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Status</span>
                                                <Badge variant={org.is_active ? "default" : "secondary"}>
                                                    {org.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Plan</span>
                                                <Badge variant="outline" className="capitalize">
                                                    {org.subscription_plan}
                                                </Badge>
                                            </div>
                                            {org.contact_email && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Email</span>
                                                    <span className="text-sm">{org.contact_email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Staff</span>
                                                <span className="text-sm">
                                                    {staff.filter(s => s.organization_id === org.id).length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Restaurants</span>
                                                <span className="text-sm">
                                                    {restaurants.filter(r => r.organization_id === org.id).length}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Staff Tab */}
                <TabsContent value="staff" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Staff Management</h3>
                        {staff.length > 0 && (
                            <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button key="admin-dashboard-add-staff-header" onClick={() => resetStaffForm()}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Staff Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleStaffSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="staff_name">Full Name *</Label>
                                            <Input
                                                id="staff_name"
                                                value={newStaff.full_name}
                                                onChange={(e) => setNewStaff(prev => ({ ...prev, full_name: e.target.value }))}
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="staff_email">Email *</Label>
                                                <Input
                                                    id="staff_email"
                                                    type="email"
                                                    value={newStaff.email}
                                                    onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                                                    placeholder="Enter email address"
                                                    required
                                                    disabled={!!editingStaff} // Disable email editing for existing staff
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="staff_password">
                                                    Password {editingStaff ? "(leave empty to keep current)" : "*"}
                                                </Label>
                                                <Input
                                                    id="staff_password"
                                                    type="password"
                                                    value={newStaff.password}
                                                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                                                    placeholder="Enter password"
                                                    required={!editingStaff} // Only required for new staff
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="staff_org">Organization *</Label>
                                                <Select
                                                    value={newStaff.organization_id}
                                                    onValueChange={(value) => setNewStaff(prev => ({ ...prev, organization_id: value }))}
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
                                            <div>
                                                <Label htmlFor="staff_restaurant">Restaurant</Label>
                                                <Select
                                                    value={newStaff.restaurant_id}
                                                    onValueChange={(value) => setNewStaff(prev => ({ ...prev, restaurant_id: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select restaurant" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No specific restaurant</SelectItem>
                                                        {restaurants
                                                            .filter(r => r.organization_id === newStaff.organization_id)
                                                            .map((restaurant) => (
                                                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                                                    {restaurant.name}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="staff_role">Role *</Label>
                                                <Select
                                                    value={newStaff.role}
                                                    onValueChange={(value: typeof newStaff.role) => setNewStaff(prev => ({ ...prev, role: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="org_admin">Organization Admin</SelectItem>
                                                        <SelectItem value="manager">Manager</SelectItem>
                                                        <SelectItem value="server">Server</SelectItem>
                                                        <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                                                        <SelectItem value="cashier">Cashier</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="staff_phone">Phone</Label>
                                                <Input
                                                    id="staff_phone"
                                                    value={newStaff.phone}
                                                    onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="hire_date">Hire Date</Label>
                                                <Input
                                                    id="hire_date"
                                                    type="date"
                                                    value={newStaff.hire_date}
                                                    onChange={(e) => setNewStaff(prev => ({ ...prev, hire_date: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="hourly_rate">Hourly Rate</Label>
                                                <Input
                                                    id="hourly_rate"
                                                    type="number"
                                                    step="0.01"
                                                    value={newStaff.hourly_rate}
                                                    onChange={(e) => setNewStaff(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="staff_active"
                                                checked={newStaff.is_active}
                                                onCheckedChange={(checked) => setNewStaff(prev => ({ ...prev, is_active: checked }))}
                                            />
                                            <Label htmlFor="staff_active">Active</Label>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" className="flex-1">
                                                {editingStaff ? "Update Staff" : "Add Staff"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setStaffDialogOpen(false)}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Staff Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {staff.length === 0 ? (
                            <Card className="col-span-full">
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Staff Found</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                        Add staff members to get started.
                                    </p>
                                    <Button key="admin-dashboard-add-staff-empty-state" onClick={() => setStaffDialogOpen(true)}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Staff Member
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            staff.map((staffMember) => (
                                <Card key={staffMember.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-lg">{staffMember.full_name}</CardTitle>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditStaff(staffMember)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteStaff(staffMember.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="text-sm">
                                            {staffMember.role.replace('_', ' ').toUpperCase()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Status</span>
                                                <Badge variant={staffMember.is_active ? "default" : "secondary"}>
                                                    {staffMember.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Organization</span>
                                                <span className="text-sm">
                                                    {organizations.find(o => o.id === staffMember.organization_id)?.name || "—"}
                                                </span>
                                            </div>
                                            {staffMember.phone && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Phone</span>
                                                    <span className="text-sm">{staffMember.phone}</span>
                                                </div>
                                            )}
                                            {staffMember.hourly_rate && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Hourly Rate</span>
                                                    <span className="text-sm">${staffMember.hourly_rate}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Restaurants Tab */}
                <TabsContent value="restaurants" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Restaurant Management</h3>
                        {restaurants.length > 0 && (
                            <Dialog open={restaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button key="admin-dashboard-add-restaurant-header" onClick={() => resetRestaurantForm()}>
                                        <Store className="h-4 w-4 mr-2" />
                                        Add Restaurant
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleRestaurantSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                                            <Input
                                                id="restaurant_name"
                                                value={newRestaurant.name}
                                                onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter restaurant name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="restaurant_org">Organization *</Label>
                                            <Select
                                                value={newRestaurant.organization_id}
                                                onValueChange={(value) => setNewRestaurant(prev => ({ ...prev, organization_id: value }))}
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
                                        <div>
                                            <Label htmlFor="restaurant_address">Address *</Label>
                                            <Textarea
                                                id="restaurant_address"
                                                value={newRestaurant.address}
                                                onChange={(e) => setNewRestaurant(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Enter restaurant address"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="restaurant_phone">Phone</Label>
                                                <Input
                                                    id="restaurant_phone"
                                                    value={newRestaurant.phone}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="restaurant_email">Email</Label>
                                                <Input
                                                    id="restaurant_email"
                                                    type="email"
                                                    value={newRestaurant.email}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, email: e.target.value }))}
                                                    placeholder="restaurant@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="restaurant_timezone">Timezone</Label>
                                                <Select
                                                    value={newRestaurant.timezone}
                                                    onValueChange={(value) => setNewRestaurant(prev => ({ ...prev, timezone: value }))}
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
                                            <div>
                                                <Label htmlFor="restaurant_currency">Currency</Label>
                                                <Select
                                                    value={newRestaurant.currency}
                                                    onValueChange={(value) => setNewRestaurant(prev => ({ ...prev, currency: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="EUR">EUR</SelectItem>
                                                        <SelectItem value="GBP">GBP</SelectItem>
                                                        <SelectItem value="CAD">CAD</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="restaurant_active"
                                                checked={newRestaurant.is_active}
                                                onCheckedChange={(checked) => setNewRestaurant(prev => ({ ...prev, is_active: checked }))}
                                            />
                                            <Label htmlFor="restaurant_active">Active</Label>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" className="flex-1">
                                                {editingRestaurant ? "Update Restaurant" : "Add Restaurant"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setRestaurantDialogOpen(false)}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Restaurants Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {restaurants.length === 0 ? (
                            <Card className="col-span-full">
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <Store className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Restaurants Found</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                        Add restaurants to get started.
                                    </p>
                                    <Button key="admin-dashboard-add-restaurant-empty-state" onClick={() => setRestaurantDialogOpen(true)}>
                                        <Store className="h-4 w-4 mr-2" />
                                        Add Restaurant
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            restaurants.map((restaurant) => (
                                <Card key={restaurant.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditRestaurant(restaurant)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="text-sm">
                                            {restaurant.address}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Status</span>
                                                <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                                                    {restaurant.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Organization</span>
                                                <span className="text-sm">
                                                    {organizations.find(o => o.id === restaurant.organization_id)?.name || "—"}
                                                </span>
                                            </div>
                                            {restaurant.phone && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Phone</span>
                                                    <span className="text-sm">{restaurant.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Currency</span>
                                                <span className="text-sm">{restaurant.currency}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{organizations.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {organizations.filter(org => org.is_active).length} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurants.length}</div>
                        <p className="text-xs text-muted-foreground">
                            across all organizations
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staff.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {staff.filter(s => s.is_active).length} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Badge variant="default" className="h-4 w-4 rounded-full bg-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Good</div>
                        <p className="text-xs text-muted-foreground">
                            all systems operational
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
