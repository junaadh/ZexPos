"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building2, Users, Plus, Edit, Trash2, Crown, UserPlus, Settings, Mail, Phone, Globe } from "lucide-react"
import { UserType, Organization, Restaurant } from "@/lib/types"
import { toast } from "sonner"

interface OrganizationSettingsProps {
    user: UserType
}

export function OrganizationSettings({ user }: OrganizationSettingsProps) {
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [staff, setStaff] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")

    const [orgForm, setOrgForm] = useState({
        name: "",
        description: "",
        contact_email: "",
        contact_phone: "",
        website: "",
        billing_address: "",
    })

    const [staffDialogOpen, setStaffDialogOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<UserType | null>(null)
    const [staffForm, setStaffForm] = useState({
        email: "",
        full_name: "",
        role: "manager" as "manager" | "server" | "kitchen" | "cashier",
        restaurant_id: "",
        permissions: [] as string[]
    })

    useEffect(() => {
        loadData()
    }, [user.organization_id])

    const loadData = async () => {
        if (!user.organization_id) return

        setLoading(true)
        try {
            const [orgResponse, restaurantsResponse, staffResponse] = await Promise.all([
                fetch('/api/org/settings'),
                fetch('/api/org/restaurants'),
                fetch('/api/org/staff')
            ])

            const [orgData, restaurantsData, staffData] = await Promise.all([
                orgResponse.json(),
                restaurantsResponse.json(),
                staffResponse.json()
            ])

            if (orgData.organization) {
                setOrganization(orgData.organization)
                setOrgForm({
                    name: orgData.organization.name,
                    description: orgData.organization.description || "",
                    contact_email: orgData.organization.contact_email || "",
                    contact_phone: orgData.organization.contact_phone || "",
                    website: orgData.organization.website || "",
                    billing_address: orgData.organization.billing_address || "",
                })
            }

            setRestaurants(restaurantsData.restaurants || [])
            setStaff(staffData.staff || [])
        } catch (error) {
            console.error('Error loading organization data:', error)
            toast.error('Failed to load organization data')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateOrganization = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!organization?.id) return

        try {
            const response = await fetch('/api/org/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orgForm),
            })

            if (!response.ok) {
                throw new Error('Failed to update organization')
            }

            toast.success('Organization updated successfully')
            loadData()
        } catch (error) {
            console.error('Error updating organization:', error)
            toast.error('Failed to update organization')
        }
    }

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user.organization_id) return

        try {
            const staffData = {
                ...staffForm,
                organization_id: user.organization_id,
                restaurant_id: staffForm.restaurant_id || null
            }

            if (editingStaff) {
                const response = await fetch(`/api/org/staff/${editingStaff.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(staffData),
                })

                if (!response.ok) {
                    throw new Error('Failed to update staff')
                }

                toast.success('Staff member updated successfully')
            } else {
                const response = await fetch('/api/org/staff', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(staffData),
                })

                if (!response.ok) {
                    throw new Error('Failed to create staff')
                }

                toast.success('Staff member added successfully')
            }

            setStaffDialogOpen(false)
            setEditingStaff(null)
            setStaffForm({
                email: "",
                full_name: "",
                role: "manager",
                restaurant_id: "",
                permissions: []
            })
            loadData()
        } catch (error) {
            console.error('Error saving staff:', error)
            toast.error('Failed to save staff member')
        }
    }

    const handleDeleteStaff = async (staffId: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return

        try {
            const response = await fetch(`/api/org/staff/${staffId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete staff')
            }

            toast.success('Staff member deleted successfully')
            loadData()
        } catch (error) {
            console.error('Error deleting staff:', error)
            toast.error('Failed to delete staff member')
        }
    }

    const editStaff = (staff: UserType) => {
        setEditingStaff(staff)
        setStaffForm({
            email: staff.email || "",
            full_name: staff.full_name || "",
            role: staff.role as any,
            restaurant_id: staff.restaurant_id || "",
            permissions: staff.permissions || []
        })
        setStaffDialogOpen(true)
    }

    const promoteToOrgAdmin = async (staffId: string) => {
        if (!confirm('Are you sure you want to promote this staff member to Organization Admin?')) return

        try {
            const response = await fetch(`/api/org/staff/${staffId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: 'org_admin' }),
            })

            if (!response.ok) {
                throw new Error('Failed to promote staff')
            }

            toast.success('Staff member promoted to Organization Admin')
            loadData()
        } catch (error) {
            console.error('Error promoting staff:', error)
            toast.error('Failed to promote staff member')
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-24" />
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <Skeleton className="h-10 w-32" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div>
                                                <Skeleton className="h-4 w-24 mb-1" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    if (!organization) {
        return <div>Organization not found</div>
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="staff">Staff Management</TabsTrigger>
                    <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{staff.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{restaurants.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Status</CardTitle>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <Badge variant={organization.is_active ? "default" : "secondary"}>
                                    {organization.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-sm font-medium">Name</Label>
                                    <p className="text-sm text-muted-foreground">{organization.name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Plan</Label>
                                    <Badge variant="outline">{organization.subscription_plan}</Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Contact Email</Label>
                                    <p className="text-sm text-muted-foreground">{organization.contact_email || "Not set"}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Contact Phone</Label>
                                    <p className="text-sm text-muted-foreground">{organization.contact_phone || "Not set"}</p>
                                </div>
                            </div>
                            {organization.description && (
                                <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-muted-foreground">{organization.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="staff" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Staff Members</h3>
                        <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Staff
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleStaffSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={staffForm.email}
                                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                            disabled={!!editingStaff}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={staffForm.full_name}
                                            onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={staffForm.role}
                                            onValueChange={(value) => setStaffForm({ ...staffForm, role: value as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="server">Server</SelectItem>
                                                <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                                                <SelectItem value="cashier">Cashier</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="restaurant">Restaurant</Label>
                                        <Select
                                            value={staffForm.restaurant_id || "all"}
                                            onValueChange={(value) => setStaffForm({
                                                ...staffForm,
                                                restaurant_id: value === "all" ? "" : value
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select restaurant (optional)" />
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
                                    <div className="flex justify-end space-x-2">
                                        <Button type="button" variant="outline" onClick={() => setStaffDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {editingStaff ? "Update" : "Add"} Staff
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {staff.map((member) => (
                            <Card key={member.id}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <p className="text-sm font-medium leading-none">{member.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                        <Badge variant={member.role === 'org_admin' ? 'default' : 'secondary'}>
                                            {member.role === 'org_admin' && <Crown className="mr-1 h-3 w-3" />}
                                            {member.role.replace('_', ' ')}
                                        </Badge>
                                        {member.is_active !== false ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {member.role !== 'org_admin' && member.role !== 'super_admin' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => promoteToOrgAdmin(member.id)}
                                            >
                                                <Crown className="mr-1 h-3 w-3" />
                                                Promote
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => editStaff(member)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        {member.role !== 'org_admin' && member.role !== 'super_admin' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteStaff(member.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="restaurants" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Restaurants</h3>
                        <Button key="organization-settings-add-restaurant" onClick={() => window.location.href = '/restaurants?action=add'}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Restaurant
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {restaurants.map((restaurant) => (
                            <Card key={restaurant.id}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div>
                                        <p className="text-sm font-medium leading-none">{restaurant.name}</p>
                                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                                            {restaurant.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.location.href = `/restaurants/${restaurant.id}`}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateOrganization} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">Organization Name</Label>
                                        <Input
                                            id="name"
                                            value={orgForm.name}
                                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_email">Contact Email</Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            value={orgForm.contact_email}
                                            onChange={(e) => setOrgForm({ ...orgForm, contact_email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_phone">Contact Phone</Label>
                                        <Input
                                            id="contact_phone"
                                            value={orgForm.contact_phone}
                                            onChange={(e) => setOrgForm({ ...orgForm, contact_phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={orgForm.website}
                                            onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={orgForm.description}
                                        onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="billing_address">Billing Address</Label>
                                    <Textarea
                                        id="billing_address"
                                        value={orgForm.billing_address}
                                        onChange={(e) => setOrgForm({ ...orgForm, billing_address: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <Button type="submit">Update Organization</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
