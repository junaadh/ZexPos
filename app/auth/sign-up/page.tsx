"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { getOrganizations, getRestaurantsByOrganization } from "@/lib/handlers/organizations"
import type { Organization, Restaurant } from "@/lib/types"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("server")
  const [organizationId, setOrganizationId] = useState("")
  const [restaurantId, setRestaurantId] = useState("")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgs = await getOrganizations()
      setOrganizations(orgs)
    }
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (organizationId && (role === 'manager' || role === 'server' || role === 'kitchen' || role === 'cashier')) {
      const fetchRestaurants = async () => {
        setLoadingRestaurants(true)
        const restaurants = await getRestaurantsByOrganization(organizationId)
        setRestaurants(restaurants)
        setRestaurantId("") // Reset restaurant selection
        setLoadingRestaurants(false)
      }
      fetchRestaurants()
    } else {
      setRestaurants([])
      setRestaurantId("")
    }
  }, [organizationId, role])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields based on role
      if (role === 'org_admin' && !organizationId) {
        throw new Error("Organization is required for organization administrators")
      }
      if ((role === 'manager' || role === 'server' || role === 'kitchen' || role === 'cashier') && (!organizationId || !restaurantId)) {
        throw new Error("Both organization and restaurant are required for restaurant staff")
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role,
            organization_id: organizationId || null,
            restaurant_id: (role === 'manager' || role === 'server' || role === 'kitchen' || role === 'cashier') ? restaurantId : null,
          },
        },
      })
      if (error) throw error
      toast.success("Account created successfully! Please check your email to verify your account.");
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      toast.error(`Sign up failed: ${errorMessage}`);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Sign up for restaurant POS access</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="org_admin">Organization Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Always show organization selection since super_admin is not an option */}
                <div className="grid gap-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select value={organizationId} onValueChange={setOrganizationId}>
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

                {(role === "manager" || role === "server" || role === "kitchen" || role === "cashier") && (
                  <div className="grid gap-2">
                    <Label htmlFor="restaurant">Restaurant</Label>
                    <Select
                      value={restaurantId}
                      onValueChange={setRestaurantId}
                      disabled={!organizationId || loadingRestaurants}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !organizationId
                            ? "Select organization first"
                            : loadingRestaurants
                              ? "Loading restaurants..."
                              : "Select restaurant"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {error && <div className="text-sm text-red-600">{error}</div>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
