"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SystemSetupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [fullName, setFullName] = useState("System Administrator")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [checkingExisting, setCheckingExisting] = useState(true)
    const [superAdminExists, setSuperAdminExists] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkExistingSuperAdmin = async () => {
            try {
                const response = await fetch('/api/setup/check')
                const { exists } = await response.json()
                setSuperAdminExists(exists)
                if (exists) {
                    // Redirect to login if super admin already exists
                    router.push('/auth/login')
                }
            } catch (error) {
                console.error('Error checking for existing super admin:', error)
            } finally {
                setCheckingExisting(false)
            }
        }

        checkExistingSuperAdmin()
    }, [router])

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (password !== confirmPassword) {
            setError("Passwords don't match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/setup/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                }),
            })

            const result = await response.json()

            if (result.success) {
                setSuccess("Super admin created successfully! You can now log in.")
                setTimeout(() => {
                    router.push('/auth/login')
                }, 2000)
            } else {
                setError(result.error || result.message)
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (checkingExisting) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <Card className="w-full max-w-sm">
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p>Checking system status...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (superAdminExists) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">System Already Configured</CardTitle>
                        <CardDescription>
                            Super admin already exists. Redirecting to login...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">System Setup</CardTitle>
                        <CardDescription>
                            Create the initial super administrator account for your ZEX-POS system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSetup}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="System Administrator"
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
                                        placeholder="admin@yourcompany.com"
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
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded border">
                                        {success}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Creating..." : "Create Super Admin"}
                                </Button>

                                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                                    <strong>Note:</strong> This setup can only be run once. The super admin will have access to all organizations and restaurants in the system.
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
