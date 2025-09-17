"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Table,
  CheckCircle,
  Clock,
  FileWarning as Cleaning,
} from "lucide-react";
import { toast } from "sonner";
import type { UserType, Restaurant } from "@/lib/types";

const statusConfig = {
  available: {
    label: "Available",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  occupied: {
    label: "Occupied",
    color: "bg-red-100 text-red-800",
    icon: Users,
  },
  reserved: {
    label: "Reserved",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  cleaning: {
    label: "Cleaning",
    color: "bg-blue-100 text-blue-800",
    icon: Cleaning,
  },
};

type TableType = {
  id: string;
  table_number: number;
  seats: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
};

interface TableManagementProps {
  user: UserType;
  restaurant: Restaurant | null;
  initialTables: TableType[];
}

export function TableManagement({
  user,
  restaurant,
  initialTables,
}: TableManagementProps) {
  const [tables, setTables] = useState(initialTables);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newTable, setNewTable] = useState<TableType>({
    id: crypto.randomUUID(),
    table_number: 0,
    seats: 4,
    status: "available" as const,
  });

  // If no restaurant is selected, show restaurant selector
  if (!restaurant) {
    return (
      <div className="flex w-screen h-screen">
        <AppSidebar user={user} restaurant={restaurant} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Table Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Select a restaurant to manage its tables
                </p>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-full">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Select Restaurant</CardTitle>
                  <CardDescription>
                    Choose a restaurant from the sidebar to manage its tables.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      User Role: <span className="font-medium">{user.role}</span>
                    </p>
                    {user.organization_id && (
                      <p className="text-sm text-gray-600">
                        Organization ID: <span className="font-medium">{user.organization_id}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleAddTable = async () => {
    if (!newTable.table_number || newTable.table_number <= 0 || !restaurant) {
      toast.error("Please enter a valid table number");
      return;
    }

    // Check if table number already exists
    if (tables.some((table) => table.table_number === newTable.table_number)) {
      toast.error("Table number already exists");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_number: newTable.table_number,
          seats: newTable.seats,
          status: newTable.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create table');
      }

      const data = await response.json();
      setTables([...tables, data]);
      setNewTable({
        id: crypto.randomUUID(),
        table_number: 0,
        seats: 4,
        status: "available",
      });
      setIsAddDialogOpen(false);
      toast.success("Table added successfully");
    } catch (error) {
      console.error("Error adding table:", error);
      toast.error("Failed to add table");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTable = async () => {
    if (!editingTable) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tables?id=${editingTable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_number: editingTable.table_number,
          seats: editingTable.seats,
          status: editingTable.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update table');
      }

      const data = await response.json();
      setTables(
        tables.map((table) =>
          table.id === editingTable.id ? data : table,
        ),
      );
      setEditingTable(null);
      toast.success("Table updated successfully");
    } catch (error) {
      console.error("Error updating table:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update table");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const response = await fetch(`/api/tables?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete table');
      }

      setTables(tables.filter((table) => table.id !== id));
      toast.success("Table deleted successfully");
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete table");
    }
  };

  const updateTableStatus = async (
    id: string,
    status: typeof newTable.status,
  ) => {
    try {
      const response = await fetch(`/api/tables?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update table status');
      }

      setTables(
        tables.map((table) => (table.id === id ? { ...table, status } : table)),
      );
      toast.success(`Table status updated to ${statusConfig[status].label}`);
    } catch (error) {
      console.error("Error updating table status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update table status");
    }
  };

  const getStatusStats = () => {
    const stats = Object.keys(statusConfig).map((status) => ({
      status: status as keyof typeof statusConfig,
      count: tables.filter((table) => table.status === status).length,
    }));
    return stats;
  };

  return (
    <div className="flex w-screen h-screen">
      <AppSidebar user={user} restaurant={restaurant} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Table Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage seating for {restaurant?.name || "your restaurant"}
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Table</DialogTitle>
                  <DialogDescription>
                    Create a new table for your restaurant
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="table-number">Table Number *</Label>
                      <Input
                        id="table-number"
                        type="number"
                        value={newTable.table_number || ""}
                        onChange={(e) =>
                          setNewTable({
                            ...newTable,
                            table_number: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter table number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seats">Number of Seats</Label>
                      <Input
                        id="seats"
                        type="number"
                        value={newTable.seats}
                        onChange={(e) =>
                          setNewTable({
                            ...newTable,
                            seats: Number.parseInt(e.target.value) || 4,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={newTable.status}
                      onValueChange={(value: typeof newTable.status) =>
                        setNewTable({ ...newTable, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(
                          ([status, config]) => (
                            <SelectItem key={status} value={status}>
                              {config.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddTable} disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Table"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {/* Status Statistics */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {getStatusStats().map((stat) => {
              const config = statusConfig[stat.status];
              const Icon = config.icon;
              return (
                <Card key={stat.status}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {config.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <p className="text-xs text-muted-foreground">
                      {((stat.count / tables.length) * 100 || 0).toFixed(0)}% of
                      tables
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tables Grid */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {tables
              .sort((a, b) => a.table_number - b.table_number)
              .map((table) => {
                const config = statusConfig[table.status];
                const Icon = config.icon;
                return (
                  <Card key={table.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Table className="h-5 w-5" />
                          <CardTitle className="text-lg">
                            #{table.table_number}
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingTable(table)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {Object.entries(statusConfig).map(
                              ([status, statusConfig]) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() =>
                                    updateTableStatus(
                                      table.id,
                                      status as typeof newTable.status,
                                    )
                                  }
                                  disabled={table.status === status}
                                >
                                  <statusConfig.icon className="h-4 w-4 mr-2" />
                                  Mark as {statusConfig.label}
                                </DropdownMenuItem>
                              ),
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteTable(table.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{table.seats} seats</span>
                      </div>
                      <Badge className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {tables.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Table className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tables configured yet.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Table
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingTable} onOpenChange={() => setEditingTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update table details</DialogDescription>
          </DialogHeader>
          {editingTable && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-table-number">Table Number</Label>
                  <Input
                    id="edit-table-number"
                    type="number"
                    value={editingTable.table_number}
                    onChange={(e) =>
                      setEditingTable({
                        ...editingTable,
                        table_number: Number.parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-seats">Number of Seats</Label>
                  <Input
                    id="edit-seats"
                    type="number"
                    value={editingTable.seats}
                    onChange={(e) =>
                      setEditingTable({
                        ...editingTable,
                        seats: Number.parseInt(e.target.value) || 4,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingTable.status}
                  onValueChange={(value: typeof newTable.status) =>
                    setEditingTable({ ...editingTable, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingTable(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditTable} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
