// src/app/dashboard/page.tsx (Final Correction)

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

// --- UI Components ---
import { Skeleton } from '@/components/ui/skeleton';
// FIX 1: Assuming the Alert components are in the expected path, 
// if this path fails, try importing from '@/components/ui' if they are exported from an index file.
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; 
import { Terminal } from 'lucide-react';

// --- Dashboard Content Components ---
import { AdminDashboard } from '@/components/admin-dashboard'; 
import { StaffDashboard } from '@/components/staff-dashboard'; 

// Define custom Session types (needed to include custom properties like roleName and token)
interface CustomUser {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roleName?: string; 
    token?: string;
}

interface CustomSession {
    user?: CustomUser;
    expires: string;
}

export default function DashboardPage() {
    // Cast the session hook result to use the CustomSession interface
    const { data: session, status } = useSession() as { data: CustomSession | null; status: string; };

    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';

    if (isLoading) {
        return (
            <div className="space-y-4 p-8">
                <Skeleton className="h-10 w-1/4" />
                <div className="grid grid-cols-3 gap-6">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    // Redirect unauthenticated users to login
    if (!isAuthenticated || !session) { // Ensure session is not null before proceeding to render
        toast.error("Session expired or user not logged in.");
        return redirect('/login');
    }

    // FIX 2: Since we checked if 'session' is null/undefined above, 
    // we can safely access user properties here, but optional chaining remains best practice.
    const userRole = session.user?.roleName?.toLowerCase() || 'staff'; 
    const userName = session.user?.name || 'User';

    // --- Render based on Role ---
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {userName}!
            </h1>
            
            {userRole === 'hr admin' || userRole === 'admin' ? (
                <>
                    <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Administrative Access</AlertTitle>
                        <AlertDescription>
                            You have **Admin** permissions. Use the menu for staff, leave, and system management.
                        </AlertDescription>
                    </Alert>
                    <AdminDashboard /> 
                </>
            ) : (
                <>
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Staff Access</AlertTitle>
                        <AlertDescription>
                            Welcome to your personalized staff portal.
                        </AlertDescription>
                    </Alert>
                    <StaffDashboard /> 
                </>
            )}
        </div>
    );
}