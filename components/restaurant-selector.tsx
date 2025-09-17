"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { Cache } from "@/lib/cache"
import type { Restaurant } from "@/lib/types"

interface RestaurantSelectorProps {
  selectedRestaurant: Restaurant | null
  onRestaurantChange: (restaurant: Restaurant) => void
}

export function RestaurantSelector({ selectedRestaurant, onRestaurantChange }: RestaurantSelectorProps) {
  const [open, setOpen] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    // Try cache first
    const cachedRestaurants = Cache.getRestaurants()
    if (cachedRestaurants) {
      setRestaurants(cachedRestaurants)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Get current user to determine access level
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase.from("restaurants").select("*")

      // Apply organization-based filtering
      const userMetadata = user.user_metadata
      const role = userMetadata?.role
      const organizationId = userMetadata?.organization_id
      const restaurantId = userMetadata?.restaurant_id

      if (role === 'super_admin') {
        // Super admins see all restaurants
        query = query.eq('is_active', true)
      } else if (role === 'org_admin' && organizationId) {
        // Org admins see restaurants in their organization
        query = query.eq('organization_id', organizationId).eq('is_active', true)
      } else if (restaurantId) {
        // Regular users see only their restaurant
        query = query.eq('id', restaurantId).eq('is_active', true)
      } else {
        // No access
        setRestaurants([])
        return
      }

      const { data, error } = await query.order("name")
      if (error) throw error

      const restaurantData = data || []
      setRestaurants(restaurantData)
      Cache.setRestaurants(restaurantData)
    } catch (error) {
      console.error("Error loading restaurants:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs h-8 bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{selectedRestaurant?.name || "Select restaurant..."}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search restaurants..." className="h-8" />
          <CommandList>
            <CommandEmpty>{loading ? "Loading..." : "No restaurants found."}</CommandEmpty>
            <CommandGroup>
              {restaurants.map((restaurant) => (
                <CommandItem
                  key={restaurant.id}
                  value={restaurant.name}
                  onSelect={() => {
                    onRestaurantChange(restaurant)
                    Cache.setSelectedRestaurant(restaurant)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-3 w-3 ${selectedRestaurant?.id === restaurant.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{restaurant.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{restaurant.address}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
