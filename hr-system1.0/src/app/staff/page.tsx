// src/app/staff/page.tsx

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react'; // <-- RECOMMENDED: Use NextAuth session for token/role

// Shadcn/Custom Imports
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle } from 'lucide-react';

// Component Imports
import { StaffRegistrationForm } from '@/components/staff-registration-form';
import { StaffEditModal } from '@/components/staff-edit-modal';
import { ColumnDef } from '@tanstack/react-table';

// Interfaces (Define shapes for better type safety)
// This interface defines the data structure required for the table and actions
interface StaffMember {
    id: string;
    fullName: string;
    email: string;
    jobTitle: string | null;
    department: string | null;
    phoneNumber: string | null;
    isActive: boolean;
    role: { name: string; id: string };
    roleId: string;
}

// This interface matches the data structure required by StaffEditModal
interface StaffEditData {
    id: string;
    fullName: string;
    email: string;
    roleId: string;
    jobTitle: string | null;
    department: string | null;
    phoneNumber: string | null;
    isActive: boolean;
}

const StaffManagementPage: React.FC = () => {
    // --- AUTH/TOKEN STATE (Using NextAuth is highly recommended, but keeping localStorage for now)
    // NOTE: This logic should ideally be replaced with useSession() for a robust NextAuth setup.
    const [token, setToken] = useState<string>('');
    const router = useRouter();

    // --- Data & Loading State ---
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- Modal State ---
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffEditData | null>(null);


    // --- 1. Data Fetching Logic (GET /api/staff) ---
    // Use useCallback to memoize the fetch function
    const fetchStaffData = useCallback(async (authToken: string) => {
        if (!authToken) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/staff', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` },
            });

            if (!response.ok) {
                // Handle 403 Forbidden specifically
                if (response.status === 403) {
                     throw new Error('Access Denied: You do not have permission to view this page.');
                }
                throw new Error('Failed to fetch staff data.');
            }

            const data = await response.json();
            setStaff(data.staff || []);

        } catch (error: any) {
            console.error('Staff data fetching error:', error);
            setError(error.message || 'Could not load staff data.');
            toast.error("Data Load Error", { description: error.message || "Failed to load staff list." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- 2. Initial Auth and Data Load ---
    useEffect(() => {
        // --- WARNING: LocalStorage for auth is insecure. Replace with useSession() ---
        const authToken = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole'); // Assuming this is set on login

        // Check for token and Authorization (case-sensitive matching is critical)
        const isAuthorized = userRole === 'HR Manager' || userRole === 'Administrator';

        if (!authToken || !isAuthorized) {
            // Redirect unauthorized users
            const redirectPath = authToken ? '/dashboard' : '/login';
            toast.error("Access Denied.", { description: "You are not authorized to view this page." });
            router.push(redirectPath);
            return;
        }

        setToken(authToken);
        fetchStaffData(authToken);
    }, [router, fetchStaffData]); // Added fetchStaffData as dependency since it's memoized

    // --- 3. CRUD Action Handlers ---

    const handleEdit = (staffMember: StaffMember) => {
        // Map the full StaffMember object to the required StaffEditData structure
        const editData: StaffEditData = {
            id: staffMember.id,
            fullName: staffMember.fullName,
            email: staffMember.email,
            roleId: staffMember.roleId, // Important for the edit modal
            jobTitle: staffMember.jobTitle,
            department: staffMember.department,
            phoneNumber: staffMember.phoneNumber,
            isActive: staffMember.isActive
        };
        setEditingStaff(editData);
        setIsEditModalOpen(true);
    };

    // --- Delete Logic (DELETE /api/staff/[id]) ---
    const handleDelete = async (staffId: string) => {
        try {
            const response = await fetch(`/api/staff/${staffId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Deletion failed.');
            }

            toast.success("Staff member deleted successfully.");
            fetchStaffData(token); // Re-fetch data

        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred during deletion.");
        }
    };

    // --- 4. DataTable Columns Definition ---
    const columns: ColumnDef<StaffMember>[] = useMemo(() => [
        { accessorKey: 'fullName', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { 
            accessorKey: 'role.name', 
            header: 'Role',
            cell: ({ row }) => <span className="font-medium">{row.original.role.name}</span>
        },
        { accessorKey: 'jobTitle', header: 'Job Title', cell: ({ row }) => row.original.jobTitle || 'N/A' },
        { accessorKey: 'department', header: 'Department', cell: ({ row }) => row.original.department || 'N/A' },
        { accessorKey: 'phoneNumber', header: 'Phone Number', cell: ({ row }) => row.original.phoneNumber || 'N/A' },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.original.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}
                >
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the staff member: **{row.original.fullName}**.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                {/* Call handleDelete only after the final confirmation */}
                                <AlertDialogAction 
                                    onClick={() => handleDelete(row.original.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Confirm Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ),
        },
    ], [token, handleDelete, handleEdit]); // Dependencies added

    // --- 5. Render Logic ---

    // Show skeleton if token is available but data is loading
    if (isLoading && token) {
        return (
            <div className="container p-8 space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Card className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </Card>
            </div>
        );
    }
    
    // Only render the page content if we have a token (meaning auth check passed)
    if (!token) {
        return null; // The redirect is already handled in useEffect
    }

    return (
        <div className="container p-8 space-y-6">
            
            {/* Header and Registration Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">👤 Staff Directory</h1>
                <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Register New Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg"> 
                         <DialogHeader>
                            <DialogTitle>Register New Staff Member</DialogTitle>
                         </DialogHeader>
                        <StaffRegistrationForm
                            onSuccess={() => { fetchStaffData(token); setIsRegisterModalOpen(false); }}
                            token={token}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Staff List ({staff.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="text-red-600 mb-4 font-medium">{error}</div>
                    )}
                    
                    {/* Render DataTable */}
                    <DataTable columns={columns} data={staff} filterColumn="fullName"/>
                </CardContent>
            </Card>

            {/* Edit Modal (Renders outside the main card) */}
            {editingStaff && (
                <StaffEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    initialData={editingStaff}
                    onSuccess={() => fetchStaffData(token)}
                    token={token}
                />
            )}
        </div>
    );
};

export default StaffManagementPage;