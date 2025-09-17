"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  Home,
  Settings,
  Users,
  Receipt,
  TrendingUp,
  LogOut,
  Building2,
  Table,
  Plus,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { RestaurantSelector } from "./restaurant-selector"
import { ThemeToggle } from "./theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Cache } from "@/lib/cache"
import type { UserType, Restaurant } from "@/lib/types"

interface AppSidebarProps {
  user: UserType
  restaurant?: Restaurant | null
}

const navigationItems = [
  // Super Admin Navigation
  {
    title: "System Overview",
    url: "/",
    icon: Home,
    roles: ["super_admin"],
  },
  {
    title: "Organizations",
    url: "/admin",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    title: "System Settings",
    url: "/settings",
    icon: Settings,
    roles: ["super_admin"],
  },

  // Organization Admin Navigation
  {
    title: "Organization Dashboard",
    url: "/",
    icon: Home,
    roles: ["org_admin"],
  },
  {
    title: "Organization Settings",
    url: "/org-settings",
    icon: Building2,
    roles: ["org_admin"],
  },
  {
    title: "Staff Management",
    url: "/staff",
    icon: Users,
    roles: ["org_admin"],
  },
  {
    title: "Restaurants",
    url: "/restaurants",
    icon: Building2,
    roles: ["org_admin"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["org_admin"],
  },

  // Restaurant Operations (Manager, Server, etc.)
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["manager", "server", "kitchen", "cashier"],
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ClipboardList,
    roles: ["manager", "server", "kitchen", "cashier"],
  },
  {
    title: "Menu",
    url: "/menu",
    icon: ChefHat,
    roles: ["manager", "server", "kitchen", "cashier"]
  },
  {
    title: "Tables",
    url: "/tables",
    icon: Table,
    roles: ["manager", "server"],
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    roles: ["manager"],
  },
  {
    title: "Staff",
    url: "/staff",
    icon: Users,
    roles: ["manager"]
  },
]

const quickActions = [
  // Super Admin Quick Actions
  {
    title: "Create Organization",
    url: "/admin?action=create",
    icon: Plus,
    roles: ["super_admin"],
  },

  // Organization Admin Quick Actions
  {
    title: "Add Staff",
    url: "/staff?action=add",
    icon: Plus,
    roles: ["org_admin"],
  },
  {
    title: "Add Restaurant",
    url: "/restaurants?action=add",
    icon: Building2,
    roles: ["org_admin"],
  },

  // Restaurant Operations Quick Actions
  {
    title: "New Order",
    url: "/orders/new",
    icon: Receipt,
    roles: ["manager", "server", "cashier"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: TrendingUp,
    roles: ["super_admin", "org_admin", "manager"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["super_admin", "org_admin", "manager"],
  },
]

export function AppSidebar({ user, restaurant: initialRestaurant }: AppSidebarProps) {
  const router = useRouter()
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(initialRestaurant || null)

  useEffect(() => {
    // Only auto-select restaurant for non-admin users or when explicitly provided
    if (user.role === "manager" || user.role === "server" || user.role === "kitchen" || user.role === "cashier") {
      if (!selectedRestaurant) {
        const cachedRestaurant = Cache.getSelectedRestaurant()
        if (cachedRestaurant) {
          setSelectedRestaurant(cachedRestaurant)
        }
      }
    } else if (initialRestaurant) {
      // For admins, only set if explicitly provided (e.g., when viewing a specific restaurant)
      setSelectedRestaurant(initialRestaurant)
    }
  }, [user.role, selectedRestaurant, initialRestaurant])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    Cache.clear()
    router.push("/auth/login")
  }

  const handleRestaurantChange = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    Cache.setSelectedRestaurant(restaurant)
    // Add restaurant ID to current URL if admin is switching context
    if (user.role === "super_admin" || user.role === "org_admin") {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('restaurant', restaurant.id)
      window.location.href = currentUrl.toString()
    } else {
      window.location.reload()
    }
  }

  const userRole = user.role || "server"
  const fullName = user.full_name || user.email
  const isAdmin = userRole === "super_admin" || userRole === "org_admin"

  // For admin users, modify URLs to include restaurant context when a restaurant is selected
  const getUrlWithRestaurantContext = (baseUrl: string) => {
    if (isAdmin && selectedRestaurant && !baseUrl.includes('admin') && !baseUrl.includes('restaurants')) {
      return `${baseUrl}?restaurant=${selectedRestaurant.id}`
    }
    return baseUrl
  }

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) => item.roles.includes(userRole))
  const filteredQuickActions = quickActions.filter((item) => item.roles.includes(userRole))

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ChefHat className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">ZexPOS</span>
            <span className="text-xs text-sidebar-foreground/60">
              {selectedRestaurant?.name || (isAdmin ? "Admin Dashboard" : "Restaurant POS")}
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Show restaurant selector for staff or when admin has selected a restaurant */}
        {((user.role === "manager" || user.role === "server" || user.role === "kitchen" || user.role === "cashier") ||
          (isAdmin && (selectedRestaurant || user.role === "org_admin"))) && (
            <RestaurantSelector selectedRestaurant={selectedRestaurant} onRestaurantChange={handleRestaurantChange} />
          )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={getUrlWithRestaurantContext(item.url)} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredQuickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={getUrlWithRestaurantContext(item.url)} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">{fullName?.charAt(0) || user.email?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{fullName || user.email}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs" onClick={handleSignOut}>
            <LogOut className="h-3 w-3 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
