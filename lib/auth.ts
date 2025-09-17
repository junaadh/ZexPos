import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { UserType } from "./types";

export function mapToUserType(user: any): UserType {
    return {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role ?? "server",
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
        organization_id: user.user_metadata?.organization_id ?? undefined,
        restaurant_id: user.user_metadata?.restaurant_id ?? undefined,
    };
}

export async function getCurrentUser(): Promise<{
    supabase: any;
    user: UserType;
    error?: any;
}> {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/auth/login");
    }

    return {
        supabase,
        user: mapToUserType(user),
        error,
    };
}

export async function getCurrentUserWithRole(allowedRoles: string[]): Promise<{
    supabase: any;
    user: UserType;
    error?: any;
}> {
    const { supabase, user, error } = await getCurrentUser();

    if (!allowedRoles.includes(user.role)) {
        redirect("/auth/login?error=insufficient_permissions");
    }

    return { supabase, user, error };
}

export function checkOrganizationAccess(user: UserType, targetOrgId?: string): boolean {
    if (user.role === "super_admin") {
        return true; // Super admin can access all organizations
    }

    if (user.role === "org_admin") {
        return user.organization_id === targetOrgId;
    }

    return false; // Regular staff can't manage organizations
}

export function checkRestaurantAccess(user: UserType, targetRestaurantId?: string): boolean {
    if (user.role === "super_admin") {
        return true; // Super admin can access all restaurants
    }

    if (user.role === "org_admin") {
        // Org admin can access restaurants in their organization
        return true; // We'll need to verify org ownership in the query
    }

    if (user.role === "manager") {
        return user.restaurant_id === targetRestaurantId;
    }

    // Staff can only access their assigned restaurant
    return user.restaurant_id === targetRestaurantId;
}
