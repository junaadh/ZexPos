"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  Clock,
  Users,
  Filter,
} from "lucide-react";
import { Restaurant, UserType, Staff } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StaffManagementProps {
  user: UserType;
  restaurant: Restaurant | null;
}

export default function StaffManagement({ user, restaurant }: StaffManagementProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<Staff> & { email?: string; password?: string }>({
    full_name: "",
    email: "",
    password: "",
    role: "server",
    phone: "",
    is_active: true,
    permissions: [],
    hourly_rate: 0,
    restaurant_id: restaurant?.id || "", // Default to current restaurant if available
  });

  const supabase = createClient();

  // Load staff data
  useEffect(() => {
    const loadStaff = async () => {
      if (!restaurant?.id) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/staff?restaurantId=${restaurant.id}`);
        if (response.ok) {
          const data = await response.json();
          setStaff(data.staff || data || []);
        } else {
          toast.error("Failed to load staff");
        }
      } catch (error) {
        toast.error("Failed to load staff");
      } finally {
        setIsLoading(false);
      }
    };

    loadStaff();
  }, [restaurant?.id]);

  // Load restaurants for org_admin users
  useEffect(() => {
    const loadRestaurants = async () => {
      if (user.role !== "org_admin" || !user.organization_id) return;

      try {
        const response = await fetch(`/api/admin/restaurants?org_id=${user.organization_id}`);
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data.restaurants || data || []);
        } else {
          console.error("Failed to load restaurants");
        }
      } catch (error) {
        console.error("Failed to load restaurants");
      }
    };

    loadRestaurants();
  }, [user.role, user.organization_id]);

  // Check permissions
  const canManageStaff = user.role === "super_admin" ||
    user.role === "org_admin" ||
    user.role === "manager";

  const canEditStaff = (staffMember: Staff) => {
    if (user.role === "super_admin") return true;
    if (user.role === "org_admin" && user.organization_id === staffMember.organization_id) return true;
    if (user.role === "manager" && user.restaurant_id === staffMember.restaurant_id) return true;
    return false;
  };

  // Filter staff
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && member.is_active) ||
      (statusFilter === "inactive" && !member.is_active);
    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleCreateStaff = async () => {
    // Determine which restaurant to use
    const targetRestaurantId = user.role === "org_admin"
      ? newStaff.restaurant_id
      : restaurant?.id;

    if (!targetRestaurantId || !newStaff.full_name?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editingStaff && (!newStaff.email?.trim() || !newStaff.password?.trim())) {
      toast.error("Email and password are required for new staff");
      return;
    }

    // For org_admin, restaurant selection is required
    if (user.role === "org_admin" && !newStaff.restaurant_id) {
      toast.error("Please select a restaurant");
      return;
    }

    // Check permissions
    if (!canManageStaff) {
      toast.error("You don't have permission to add staff");
      return;
    }

    setIsLoading(true);
    try {
      const staffData = {
        name: newStaff.full_name, // Map full_name to name for API
        email: newStaff.email,
        role: newStaff.role || "server",
        organization_id: user.organization_id || undefined,
        restaurant_id: targetRestaurantId,
        phone: newStaff.phone,
        hourly_rate: newStaff.hourly_rate,
        ...(newStaff.password && { password: newStaff.password }) // Only include password if provided
      };

      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      if (response.ok) {
        const data = await response.json();
        const newStaffMember = data.staff || data;
        setStaff([...staff, newStaffMember]);
        setNewStaff({
          full_name: "",
          email: "",
          password: "",
          role: "server",
          phone: "",
          is_active: true,
          permissions: [],
          hourly_rate: 0,
        });
        setIsAddDialogOpen(false);
        toast.success("Staff member added successfully");
      } else {
        const errorData = await response.json();
        console.error('Error creating staff:', errorData);
        toast.error(errorData.error || "Failed to add staff member");
      }
    } catch (error) {
      toast.error("Failed to add staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStaff = (staffMember: Staff) => {
    if (!canEditStaff(staffMember)) {
      toast.error("You don't have permission to edit this staff member");
      return;
    }
    setEditingStaff(staffMember);
    setNewStaff({
      full_name: staffMember.full_name || "",
      email: (staffMember as any).email || "", // Email might come from API response
      password: "", // Don't pre-fill password for editing
      role: staffMember.role,
      phone: staffMember.phone || "",
      is_active: staffMember.is_active,
      permissions: staffMember.permissions || [],
      hourly_rate: staffMember.hourly_rate || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStaff = async (staffMember: Staff) => {
    if (!canEditStaff(staffMember)) {
      toast.error("You don't have permission to delete this staff member");
      return;
    }

    setDeletingStaff(staffMember);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStaff = async () => {
    if (!deletingStaff) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', deletingStaff.id);

      if (error) throw error;

      setStaff(staff.filter(s => s.id !== deletingStaff.id));
      toast.success("Staff member deleted successfully");
    } catch (error) {
      toast.error("Failed to delete staff member");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingStaff(null);
    }
  };

  const roleOptions = [
    { value: "manager", label: "Manager" },
    { value: "server", label: "Server" },
    { value: "kitchen", label: "Kitchen Staff" },
    { value: "cashier", label: "Cashier" },
  ];

  // Only show role options that current user can assign
  const availableRoles = roleOptions.filter(role => {
    if (user.role === "super_admin") return true;
    if (user.role === "org_admin") return role.value !== "super_admin";
    if (user.role === "manager") return ["server", "kitchen", "cashier"].includes(role.value);
    return false;
  });

  return (
    <div className="flex w-screen h-screen">
      <AppSidebar user={user} restaurant={restaurant} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Staff Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage your restaurant staff and schedules
              </p>
            </div>
            {canManageStaff && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Create a new staff member for {restaurant?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={newStaff.full_name || ""}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStaff.email || ""}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        required
                        disabled={!!editingStaff} // Disable email editing for existing staff
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">
                        Password {editingStaff ? "(leave empty to keep current)" : "*"}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newStaff.password || ""}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        required={!editingStaff} // Only required for new staff
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={newStaff.role}
                        onValueChange={(value) => setNewStaff(prev => ({ ...prev, role: value as Staff['role'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {user.role === "org_admin" && restaurants.length > 0 && (
                      <div>
                        <Label htmlFor="restaurant">Restaurant *</Label>
                        <Select
                          value={newStaff.restaurant_id || ""}
                          onValueChange={(value) => setNewStaff(prev => ({ ...prev, restaurant_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select restaurant" />
                          </SelectTrigger>
                          <SelectContent>
                            {restaurants.map((rest) => (
                              <SelectItem key={rest.id} value={rest.id}>
                                {rest.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newStaff.phone || ""}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={newStaff.hourly_rate || ""}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter hourly rate"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={newStaff.is_active}
                        onCheckedChange={(checked) => setNewStaff(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateStaff}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? "Adding..." : "Add Staff Member"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members ({filteredStaff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading staff...</div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff members found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {member.full_name?.slice(0, 2).toUpperCase() || "ST"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name || "N/A"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.phone || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.hourly_rate ? `$${member.hourly_rate}/hr` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(member.hire_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEditStaff(member) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditStaff(member)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteStaff(member)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingStaff?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStaff}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
