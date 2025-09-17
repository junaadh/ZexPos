"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  Tag,
  Upload,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getImageUrl, handleImageError, validateImageUpload } from "@/lib/image-utils";
import type { Restaurant, MenuItem, MenuCategory, UserType } from "@/lib/types";

interface MenuManagementProps {
  user: UserType;
  restaurant: Restaurant | null;
  initialCategories: MenuCategory[];
  initialMenuItems: MenuItem[];
}

export function MenuManagement({
  user,
  restaurant,
  initialCategories,
  initialMenuItems,
}: MenuManagementProps) {
  console.log("MenuManagement render");
  console.log("Restaurant prop:", restaurant);
  console.log("User prop:", user);
  console.log("Initial categories:", initialCategories);
  console.log("Initial menu items:", initialMenuItems);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] =
    useState<MenuCategory[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    is_available: true,
    prep_time: 10,
    allergens: [],
  });

  // Category management state
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<MenuCategory>>({
    name: "",
    description: "",
    sort_order: categories.length + 1,
    is_active: true,
  });

  // Permission logic
  const canManageItems = ['super_admin', 'org_admin', 'manager'].includes(user.role);
  const canToggleAvailability = true; // All staff can toggle availability

  const supabase = createClient();

  // Generate predictable image URL for menu items
  const getMenuItemImageUrl = (item: MenuItem): string => {
    // If item has a stored image_url that's not a placeholder, use it
    if (item.image_url && item.image_url !== '/placeholder.jpg' && !item.image_url.includes('placeholder')) {
      return item.image_url;
    }

    // If no restaurant context, fall back to placeholder
    if (!restaurant) {
      return '/placeholder.jpg';
    }

    // Try to construct predictable image URL
    const orgId = restaurant.organization_id || 'default';
    const restaurantId = restaurant.id;
    const itemId = item.id;

    // Try common image extensions in order of preference
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    // For now, return the first possible URL with jpg extension
    // The onError handler will try other extensions if needed
    const predictablePath = `menu-items/${orgId}.${restaurantId}.${itemId}.jpg`;
    const predictableUrl = supabase.storage.from('menu-images').getPublicUrl(predictablePath).data.publicUrl;

    console.log(`Generated predictable URL for item ${item.name}:`, predictableUrl);

    return predictableUrl;
  };

  // Function to try different image extensions
  const tryImageExtensions = (baseUrl: string, extensions: string[] = ['jpg', 'jpeg', 'png', 'webp']): string => {
    // Extract the base path without extension
    const basePath = baseUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '');

    // Return the URL with the first extension to try
    return `${basePath}.${extensions[0]}`;
  }; const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      categoryFilter === "All" || item.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    console.log("uploadImage called with file:", file);
    console.log("File name:", file.name);
    console.log("File size:", file.size);
    console.log("File type:", file.type);

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log("Uploading via API route...");

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      console.log("Upload successful:", data);

      return data.url
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const uploadImageWithPath = async (file: File, fileName: string): Promise<string | null> => {
    console.log("uploadImageWithPath called with file:", file);
    console.log("Predictable file name:", fileName);
    console.log("Current user for upload:", user);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `menu-items/${fileName}`;

      console.log("Uploading to path:", filePath);
      console.log("Using bucket: menu-images");

      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("Authenticated user for storage:", currentUser);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, {
          upsert: true, // Replace if exists
        });

      console.log("Upload response data:", uploadData);

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        console.error("Upload error message:", uploadError.message);
        throw new Error(`Upload failed: ${uploadError.message}`);
      } console.log("Upload successful, getting public URL...");

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      console.log("Public URL data:", data);
      console.log("Public URL:", data.publicUrl);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image with path:", error);
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }; const toggleAvailability = async (id: string) => {
    if (!canToggleAvailability) {
      toast.error("You don't have permission to toggle item availability");
      return;
    }

    const item = menuItems.find((item) => item.id === id);
    if (!item) return;

    try {
      const response = await fetch(`/api/menu?id=${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_available: !item.is_available,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update availability');
      }

      setMenuItems(
        menuItems.map((item) =>
          item.id === id ? { ...item, is_available: !item.is_available } : item,
        ),
      );
      toast.success(`Item ${!item.is_available ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update availability");
    }
  };

  const handleAddCategory = async () => {
    if (!canManageItems) {
      toast.error("You don't have permission to add menu categories");
      return;
    }

    if (!newCategory.name || !restaurant) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/menu?type=category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description || "",
          restaurant_id: restaurant.id,
          sort_order: newCategory.sort_order || categories.length + 1,
          is_active: newCategory.is_active ?? true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create menu category');
      }

      const data = await response.json();
      setCategories([...categories, data]);
      setNewCategory({
        name: "",
        description: "",
        sort_order: categories.length + 2,
        is_active: true,
      });
      setIsAddCategoryDialogOpen(false);
      toast.success("Menu category added successfully");
    } catch (error) {
      console.error("Error adding menu category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add menu category");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!canManageItems) {
      toast.error("You don't have permission to delete menu items");
      return;
    }

    try {
      const response = await fetch(`/api/menu?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete menu item');
      }

      setMenuItems(menuItems.filter((item) => item.id !== id));
      toast.success("Menu item deleted successfully");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete menu item");
    }
  };

  const handleAddItem = async () => {
    console.log("handleAddItem called");
    console.log("canManageItems:", canManageItems);
    console.log("newItem:", newItem);
    console.log("restaurant:", restaurant);
    console.log("categories:", categories);

    if (!canManageItems) {
      toast.error("You don't have permission to add menu items");
      return;
    }

    if (!newItem.name) {
      toast.error("Please enter an item name");
      return;
    }

    if (!newItem.price || newItem.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!newItem.category_id) {
      if (categories.length === 0) {
        toast.error("Please add a category first before creating menu items");
        return;
      } else {
        toast.error("Please select a category");
        return;
      }
    }

    if (!restaurant) {
      toast.error("Restaurant information is missing");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting item creation...");

      // First, create the menu item without image
      const requestBody = {
        name: newItem.name,
        description: newItem.description || "",
        price: newItem.price,
        category_id: newItem.category_id,
        restaurant_id: restaurant.id,
        is_available: newItem.is_available ?? true,
        prep_time: newItem.prep_time || 10,
        allergens: newItem.allergens || [],
        image_url: null, // We'll update this after getting the item ID
      };

      console.log("Request body:", requestBody);
      console.log("Category ID being sent:", requestBody.category_id);
      console.log("Available categories:", categories.map(c => ({ id: c.id, name: c.name })));

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("API Error:", error);
        throw new Error(error.error || 'Failed to create menu item');
      }

      const data = await response.json();
      console.log("Created item:", data);

      // Now upload image with predictable path if we have one
      let finalImageUrl = null;
      if (imageFile && data.id) {
        console.log("Uploading image with item ID:", data.id);

        // Use predictable naming: org_id.restaurant_id.item_id.original_extension
        const fileExt = imageFile.name.split(".").pop() || 'jpg';
        const orgId = restaurant.organization_id || 'default';
        const predictableName = `${orgId}.${restaurant.id}.${data.id}.${fileExt}`;

        console.log("Using predictable name:", predictableName);

        finalImageUrl = await uploadImageWithPath(imageFile, predictableName);

        // If direct storage upload fails, try the API route as fallback
        if (!finalImageUrl) {
          console.log("Direct storage upload failed, trying API route fallback...");
          finalImageUrl = await uploadImage(imageFile);
        }

        if (finalImageUrl) {
          // Update the item with the image URL
          const updateResponse = await fetch(`/api/menu?id=${encodeURIComponent(data.id)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...data,
              image_url: finalImageUrl,
            }),
          });

          if (updateResponse.ok) {
            const updatedData = await updateResponse.json();
            console.log("Updated item with image:", updatedData);
            setMenuItems([...menuItems, updatedData]);
          } else {
            console.warn("Failed to update item with image URL, using item without image");
            setMenuItems([...menuItems, data]);
          }
        } else {
          setMenuItems([...menuItems, data]);
        }
      } else {
        setMenuItems([...menuItems, data]);
      }
      setNewItem({
        name: "",
        description: "",
        price: 0,
        category_id: "",
        is_available: true,
        prep_time: 10,
        allergens: [],
      });
      setImageFile(null);
      setIsAddDialogOpen(false);
      toast.success("Menu item added successfully");
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add menu item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    setIsLoading(true);
    try {
      let imageUrl = editingItem.image_url;
      if (imageFile) {
        const url = await uploadImage(imageFile);
        imageUrl = url ? url : undefined;
      }

      const response = await fetch(`/api/menu?id=${encodeURIComponent(editingItem.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          category_id: editingItem.category_id,
          is_available: editingItem.is_available,
          prep_time: editingItem.prep_time,
          allergens: editingItem.allergens,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update menu item');
      }

      const updatedItem = await response.json();
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingItem.id ? updatedItem : item,
        ),
      );
      setEditingItem(null);
      setImageFile(null);
      toast.success("Menu item updated successfully");
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update menu item");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryStats = () => {
    return categories.map((category) => ({
      category: category.name,
      id: category.id,
      total: menuItems.filter((item) => item.category_id === category.id)
        .length,
      available: menuItems.filter(
        (item) => item.category_id === category.id && item.is_available,
      ).length,
    }));
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
                Menu Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {restaurant ? `Manage menu items for ${restaurant.name}` : "Select a restaurant to manage its menu"}
              </p>
            </div>
            {canManageItems && restaurant && (
              <div className="flex gap-2">
                <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                      <DialogDescription>
                        Create a new category for your menu items
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          value={newCategory.name}
                          onChange={(e) =>
                            setNewCategory({ ...newCategory, name: e.target.value })
                          }
                          placeholder="e.g., Appetizers, Main Courses"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-description">Description (Optional)</Label>
                        <Textarea
                          id="category-description"
                          value={newCategory.description}
                          onChange={(e) =>
                            setNewCategory({ ...newCategory, description: e.target.value })
                          }
                          placeholder="Brief description of this category"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="category-active"
                          checked={newCategory.is_active}
                          onCheckedChange={(checked: boolean) =>
                            setNewCategory({ ...newCategory, is_active: checked })
                          }
                        />
                        <Label htmlFor="category-active">Active</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddCategoryDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddCategory} disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Category"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Menu Item</DialogTitle>
                      <DialogDescription>
                        Create a new item for your restaurant menu
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="image">Item Image</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                const validation = validateImageUpload(file);
                                if (!validation.isValid) {
                                  toast.error(validation.error);
                                  return;
                                }
                              }
                              setImageFile(file);
                            }}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                        {imageFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {imageFile.name}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Item Name *</Label>
                          <Input
                            id="name"
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                            placeholder="Enter item name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={newItem.category_id}
                            onValueChange={(value) =>
                              setNewItem({ ...newItem, category_id: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newItem.description}
                          onChange={(e) =>
                            setNewItem({ ...newItem, description: e.target.value })
                          }
                          placeholder="Describe the item..."
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price ($) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newItem.price}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                price: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prepTime">Prep Time (min)</Label>
                          <Input
                            id="prepTime"
                            type="number"
                            value={newItem.prep_time}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                prep_time: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id="available"
                            checked={newItem.is_available}
                            onCheckedChange={(checked) =>
                              setNewItem({ ...newItem, is_available: checked })
                            }
                          />
                          <Label htmlFor="available">Available</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="allergens">
                          Allergens (comma-separated)
                        </Label>
                        <Input
                          id="allergens"
                          value={newItem.allergens?.join(", ") || ""}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              allergens: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., Gluten, Dairy, Nuts"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          console.log("=== DEBUG INFO ===");
                          console.log("canManageItems:", canManageItems);
                          console.log("user:", user);
                          console.log("restaurant:", restaurant);
                          console.log("categories:", categories);
                          console.log("newItem:", newItem);
                          console.log("==================");
                        }}
                      >
                        Debug
                      </Button>
                      <Button onClick={handleAddItem} disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Item"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {!restaurant ? (
            // Show restaurant selection prompt for admins
            <div className="flex items-center justify-center h-full">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Select Restaurant</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose a restaurant from the sidebar to manage its menu items.
                  </p>
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
          ) : (
            <>
              {/* Category Statistics */}
              <div className="grid gap-4 md:grid-cols-5 mb-6">{getCategoryStats().map((stat) => (
                <Card key={stat.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.available}</div>
                    <p className="text-xs text-muted-foreground">
                      of {stat.total} available
                    </p>
                  </CardContent>
                </Card>
              ))}
              </div>

              {/* Search and Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search menu items..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`${!item.is_available ? "opacity-60" : ""}`}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={getMenuItemImageUrl(item)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const currentSrc = target.src;

                          // Extract base path without extension
                          const basePath = currentSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '');

                          // Try different extensions
                          if (currentSrc.endsWith('.jpg')) {
                            target.src = `${basePath}.png`;
                          } else if (currentSrc.endsWith('.png')) {
                            target.src = `${basePath}.jpeg`;
                          } else if (currentSrc.endsWith('.jpeg')) {
                            target.src = `${basePath}.webp`;
                          } else {
                            // All extensions failed, use placeholder
                            target.src = '/placeholder.jpg';
                          }
                        }}
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.menu_categories?.name}
                            </Badge>
                            {!item.is_available && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Unavailable
                              </Badge>
                            )}
                          </div>
                        </div>
                        {(canManageItems || canToggleAvailability) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canManageItems && (
                                <DropdownMenuItem onClick={() => setEditingItem(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canToggleAvailability && (
                                <DropdownMenuItem
                                  onClick={() => toggleAvailability(item.id)}
                                >
                                  {item.is_available ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Make Unavailable
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Make Available
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {canManageItems && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium text-primary">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{item.prep_time}m</span>
                          </div>
                        </div>
                      </div>

                      {item.allergens && item.allergens.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {item.allergens.map((allergen) => (
                            <Badge
                              key={allergen}
                              variant="outline"
                              className="text-xs"
                            >
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No menu items found matching your criteria.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit Dialog - Similar structure with image support */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of this menu item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-image">Item Image</Label>
                <div className="aspect-video w-32 overflow-hidden rounded-lg mb-2">
                  <img
                    src={getMenuItemImageUrl(editingItem)}
                    alt={editingItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const currentSrc = target.src;

                      // Extract base path without extension
                      const basePath = currentSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '');

                      // Try different extensions
                      if (currentSrc.endsWith('.jpg')) {
                        target.src = `${basePath}.png`;
                      } else if (currentSrc.endsWith('.png')) {
                        target.src = `${basePath}.jpeg`;
                      } else if (currentSrc.endsWith('.jpeg')) {
                        target.src = `${basePath}.webp`;
                      } else {
                        // All extensions failed, use placeholder
                        target.src = '/placeholder.jpg';
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        const validation = validateImageUpload(file);
                        if (!validation.isValid) {
                          toast.error(validation.error);
                          return;
                        }
                      }
                      setImageFile(file);
                    }}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingItem.category_id}
                    onValueChange={(value) =>
                      setEditingItem({ ...editingItem, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prepTime">Prep Time (min)</Label>
                  <Input
                    id="edit-prepTime"
                    type="number"
                    value={editingItem.prep_time}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        prep_time: Number.parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="edit-available"
                    checked={editingItem.is_available}
                    onCheckedChange={(checked) =>
                      setEditingItem({ ...editingItem, is_available: checked })
                    }
                  />
                  <Label htmlFor="edit-available">Available</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-allergens">
                  Allergens (comma-separated)
                </Label>
                <Input
                  id="edit-allergens"
                  value={editingItem.allergens?.join(", ") || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      allergens: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., Gluten, Dairy, Nuts"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
