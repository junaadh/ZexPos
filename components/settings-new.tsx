"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Database, Palette, Globe, User, Building } from "lucide-react";
import { Restaurant, UserType, Organization } from "@/lib/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface SettingsComponentProps {
    user: UserType;
    restaurant: Restaurant | null;
}

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    phone?: string;
    role: string;
    organization_id?: string;
    restaurant_id?: string;
    is_active?: boolean;
    hire_date?: string;
    hourly_rate?: number;
    permissions?: string[];
    created_at?: string;
    updated_at?: string;
}

interface OrganizationData {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    website?: string;
    contact_email?: string;
    contact_phone?: string;
    billing_address?: string;
    subscription_plan?: string;
    is_active?: boolean;
}

interface OrganizationSettings {
    timezone?: string;
    currency?: string;
    theme?: string;
    notifications_enabled?: boolean;
    auto_logout_minutes?: number;
    receipt_template?: string;
    tax_rate?: number;
    service_charge?: number;
}

export default function SettingsComponent({
    user,
    restaurant,
}: SettingsComponentProps) {
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
    const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings>({});
    const [activeTab, setActiveTab] = useState("profile");

    // Load user profile
    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const response = await fetch('/api/user/profile');
                if (response.ok) {
                    const data = await response.json();
                    setUserProfile(data.profile);
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        };

        loadUserProfile();
    }, []);

    // Load organization data (only for org_admin and super_admin)
    useEffect(() => {
        const loadOrganizationData = async () => {
            if (!['org_admin', 'super_admin'].includes(user.role)) return;

            try {
                const [orgResponse, settingsResponse] = await Promise.all([
                    fetch('/api/org/settings'),
                    fetch('/api/org/settings/detailed')
                ]);

                if (orgResponse.ok) {
                    const orgData = await orgResponse.json();
                    setOrganizationData(orgData.organization);
                }

                if (settingsResponse.ok) {
                    const settingsData = await settingsResponse.json();
                    setOrganizationSettings(settingsData.settings || {});
                }
            } catch (error) {
                console.error('Error loading organization data:', error);
            }
        };

        loadOrganizationData();
    }, [user.role]);

    const handleUserProfileUpdate = async (formData: FormData) => {
        setLoading(true);
        try {
            const updateData = {
                full_name: formData.get('full_name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
            };

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                const data = await response.json();
                setUserProfile(data.profile);
                toast.success("Profile updated successfully");
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationUpdate = async (formData: FormData) => {
        setLoading(true);
        try {
            const updateData = {
                name: formData.get('organization_name') as string,
                description: formData.get('description') as string,
                website: formData.get('website') as string,
                contact_email: formData.get('contact_email') as string,
                contact_phone: formData.get('contact_phone') as string,
                billing_address: formData.get('billing_address') as string,
            };

            const response = await fetch('/api/org/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                const data = await response.json();
                setOrganizationData(data.organization);
                toast.success("Organization updated successfully");
            } else {
                throw new Error('Failed to update organization');
            }
        } catch (error) {
            console.error('Error updating organization:', error);
            toast.error("Failed to update organization");
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationSettingsUpdate = async (settings: Partial<OrganizationSettings>) => {
        setLoading(true);
        try {
            const response = await fetch('/api/org/settings/detailed', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            if (response.ok) {
                const data = await response.json();
                setOrganizationSettings(prev => ({ ...prev, ...data.settings }));
                toast.success("Settings updated successfully");
            } else {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            console.error('Error updating organization settings:', error);
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    const isOrgAdmin = ['org_admin', 'super_admin'].includes(user.role);

    return (
        <div className="flex w-screen h-screen">
            <AppSidebar user={user} restaurant={restaurant} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
                    <SidebarTrigger />
                    <div className="flex flex-1 items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">
                                Settings
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Configure system preferences and user settings
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="profile">
                                <User className="h-4 w-4 mr-2" />
                                Profile
                            </TabsTrigger>
                            {isOrgAdmin && (
                                <TabsTrigger value="organization">
                                    <Building className="h-4 w-4 mr-2" />
                                    Organization
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="notifications">
                                <Bell className="h-4 w-4 mr-2" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="security">
                                <Shield className="h-4 w-4 mr-2" />
                                Security
                            </TabsTrigger>
                            <TabsTrigger value="integrations">
                                <Globe className="h-4 w-4 mr-2" />
                                Integrations
                            </TabsTrigger>
                        </TabsList>

                        {/* User Profile Tab */}
                        <TabsContent value="profile" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your personal details and contact information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form action={handleUserProfileUpdate} className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="full_name">Full Name</Label>
                                                <Input
                                                    id="full_name"
                                                    name="full_name"
                                                    defaultValue={userProfile?.full_name || ''}
                                                    placeholder="Enter your full name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    defaultValue={userProfile?.email || ''}
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    defaultValue={userProfile?.phone || ''}
                                                    placeholder="Enter your phone number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="role">Role</Label>
                                                <Input
                                                    id="role"
                                                    value={userProfile?.role || user.role}
                                                    disabled
                                                    className="bg-muted"
                                                />
                                            </div>
                                        </div>
                                        {userProfile?.hire_date && (
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="hire_date">Hire Date</Label>
                                                    <Input
                                                        id="hire_date"
                                                        value={new Date(userProfile.hire_date).toLocaleDateString()}
                                                        disabled
                                                        className="bg-muted"
                                                    />
                                                </div>
                                                {userProfile?.hourly_rate && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="hourly_rate">Hourly Rate</Label>
                                                        <Input
                                                            id="hourly_rate"
                                                            value={`$${userProfile.hourly_rate}/hr`}
                                                            disabled
                                                            className="bg-muted"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <Button type="submit" disabled={loading}>
                                            {loading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Organization Tab (only for org admins) */}
                        {isOrgAdmin && (
                            <TabsContent value="organization" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building className="h-5 w-5" />
                                            Organization Information
                                        </CardTitle>
                                        <CardDescription>
                                            Manage your organization's basic information and settings
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form action={handleOrganizationUpdate} className="space-y-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="organization_name">Organization Name</Label>
                                                    <Input
                                                        id="organization_name"
                                                        name="organization_name"
                                                        defaultValue={organizationData?.name || ''}
                                                        placeholder="Enter organization name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="contact_phone">Contact Phone</Label>
                                                    <Input
                                                        id="contact_phone"
                                                        name="contact_phone"
                                                        defaultValue={organizationData?.contact_phone || ''}
                                                        placeholder="Enter contact phone"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Input
                                                    id="description"
                                                    name="description"
                                                    defaultValue={organizationData?.description || ''}
                                                    placeholder="Organization description"
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="website">Website</Label>
                                                    <Input
                                                        id="website"
                                                        name="website"
                                                        defaultValue={organizationData?.website || ''}
                                                        placeholder="https://yourwebsite.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="contact_email">Contact Email</Label>
                                                    <Input
                                                        id="contact_email"
                                                        name="contact_email"
                                                        type="email"
                                                        defaultValue={organizationData?.contact_email || ''}
                                                        placeholder="contact@organization.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="billing_address">Billing Address</Label>
                                                <Input
                                                    id="billing_address"
                                                    name="billing_address"
                                                    defaultValue={organizationData?.billing_address || ''}
                                                    placeholder="Full billing address"
                                                />
                                            </div>
                                            <Button type="submit" disabled={loading}>
                                                {loading ? "Saving..." : "Save Organization"}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Organization Settings
                                        </CardTitle>
                                        <CardDescription>
                                            Configure system-wide settings for your organization
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="timezone">Timezone</Label>
                                                <Select
                                                    value={organizationSettings.timezone || "America/New_York"}
                                                    onValueChange={(value) => handleOrganizationSettingsUpdate({ timezone: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                                                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                                        <SelectItem value="Europe/London">London Time</SelectItem>
                                                        <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="currency">Currency</Label>
                                                <Select
                                                    value={organizationSettings.currency || "USD"}
                                                    onValueChange={(value) => handleOrganizationSettingsUpdate({ currency: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                                                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Auto Logout</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Automatically log out inactive users
                                                </p>
                                            </div>
                                            <Select
                                                value={organizationSettings.auto_logout_minutes?.toString() || "30"}
                                                onValueChange={(value) => handleOrganizationSettingsUpdate({ auto_logout_minutes: parseInt(value) })}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="15">15 minutes</SelectItem>
                                                    <SelectItem value="30">30 minutes</SelectItem>
                                                    <SelectItem value="60">1 hour</SelectItem>
                                                    <SelectItem value="120">2 hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Separator />

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                                                <Input
                                                    id="tax_rate"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={organizationSettings.tax_rate || ''}
                                                    onChange={(e) => handleOrganizationSettingsUpdate({ tax_rate: parseFloat(e.target.value) || 0 })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="service_charge">Default Service Charge (%)</Label>
                                                <Input
                                                    id="service_charge"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={organizationSettings.service_charge || ''}
                                                    onChange={(e) => handleOrganizationSettingsUpdate({ service_charge: parseFloat(e.target.value) || 0 })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Notification Preferences
                                    </CardTitle>
                                    <CardDescription>
                                        Configure when and how you receive notifications
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>New Orders</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified when new orders are placed
                                            </p>
                                        </div>
                                        <Switch
                                            checked={organizationSettings.notifications_enabled ?? true}
                                            onCheckedChange={(checked) => handleOrganizationSettingsUpdate({ notifications_enabled: checked })}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Order Delays</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Alert when orders are taking longer than expected
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Low Inventory</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Notify when inventory levels are low
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Staff Schedule Changes</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Alert when staff schedules are modified
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Daily Reports</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive daily summary reports via email
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Security Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Manage security and access control settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Two-Factor Authentication</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Add an extra layer of security to your account
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Session Timeout</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically log out inactive users
                                            </p>
                                        </div>
                                        <Select defaultValue="30">
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="60">1 hour</SelectItem>
                                                <SelectItem value="120">2 hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Password Requirements</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Enforce strong password policies
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label>Backup & Recovery</Label>
                                        <div className="flex gap-2">
                                            <Button variant="outline">Download Backup</Button>
                                            <Button variant="outline">Schedule Backups</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Integrations Tab */}
                        <TabsContent value="integrations" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        Third-Party Integrations
                                    </CardTitle>
                                    <CardDescription>
                                        Connect with external services and platforms
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                <span className="text-green-600 font-semibold">$</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">Payment Gateway</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Process credit card payments
                                                </p>
                                            </div>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Database className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Inventory Management</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Sync with inventory systems
                                                </p>
                                            </div>
                                        </div>
                                        <Switch />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <Bell className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">SMS Notifications</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Send order updates via SMS
                                                </p>
                                            </div>
                                        </div>
                                        <Switch />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
