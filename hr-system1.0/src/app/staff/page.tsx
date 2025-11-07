// src/app/staff/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // <-- UPDATED: Import toast function directly from Sonner

// Shadcn/Custom Imports
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
// REMOVED: import { useToast } from '@/components/ui/use-toast';
import { DataTable } from '@/components/ui/data-table'; // Assume this exists
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; 

// Component Imports
import { StaffRegistrationForm } from '@/components/staff-registration-form';
import { StaffEditModal } from '@/components/staff-edit-modal';
import { ColumnDef } from '@tanstack/react-table';

// Interfaces (Define shapes for better type safety)
interface StaffMember {
    id: string;
    fullName: string;
    email: string;
    jobTitle: string | null;
    department: string | null;
    isActive: boolean;
    role: { name: string; id: string }; 
    roleId: string; // Needed for the edit form
}

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
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffEditData | null>(null);

    // REMOVED: const { toast } = useToast();
    const router = useRouter();

    // --- 1. Initial Auth and Token Check ---
    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');

        // NOTE: Replace these string literals with the actual role names or IDs you use for checking!
        const isAuthorized = userRole === 'Administrator' || userRole === 'HR Manager'; 

        if (!authToken || !isAuthorized) {
            router.push(authToken ? '/dashboard' : '/login');
            return;
        }
        
        setToken(authToken);
        fetchStaffData(authToken);
    }, [router]);

    // --- 2. Data Fetching Logic (GET /api/users) ---
    const fetchStaffData = async (authToken: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch staff data.');
            }

            const data = await response.json();
            setStaff(data.users || []);
            
        } catch (error) {
            console.error('Staff data fetching error:', error);
            setError('Could not connect to the staff API or load data.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- 3. CRUD Action Handlers ---
    
    const handleEdit = (staffMember: StaffMember) => {
        // Map the full StaffMember object to the required StaffEditData structure
        const editData: StaffEditData = {
            id: staffMember.id,
            fullName: staffMember.fullName,
            email: staffMember.email,
            roleId: staffMember.roleId, 
            jobTitle: staffMember.jobTitle,
            department: staffMember.department,
            phoneNumber: staffMember.phoneNumber,
            isActive: staffMember.isActive
        };
        setEditingStaff(editData);
        setIsEditModalOpen(true);
    };

    // --- Delete Logic (DELETE /api/users/[id]) ---
    const handleDelete = async (staffId: string) => {
        try {
            const response = await fetch(`/api/users/${staffId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Deletion failed.');
            }

            // UPDATED: Use Sonner syntax
            toast.success("Staff member deleted successfully.");
            fetchStaffData(token); // Re-fetch data
            
        } catch (error: any) {
            // UPDATED: Use Sonner syntax
            toast.error(error.message || "An unexpected error occurred during deletion.");
        }
    };

    // --- 4. DataTable Columns Definition ---
    const columns: ColumnDef<StaffMember>[] = useMemo(() => [
        { accessorKey: 'fullName', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'role.name', header: 'Role' },
        { accessorKey: 'jobTitle', header: 'Job Title' },
        { accessorKey: 'department', header: 'Department' },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.original.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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
                <div className="space-x-2">
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
                                <AlertDialogAction onClick={() => handleDelete(row.original.id)}>
                                    Confirm Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ),
        },
    ], [token]);
    
    // --- 5. Render Logic ---
    if (!token && !isLoading) {
        return null; // Redirect is handled in useEffect
    }

    return (
        <div className="container p-8">
            {/* Header and Registration Button */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">👤 Staff Management</h1>
                <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
                    <DialogTrigger asChild>
                        <Button>+ Register New Staff</Button>
                    </DialogTrigger>
                    {/* Dialog Content for Registration */}
                    <StaffRegistrationForm 
                        onSuccess={() => { fetchStaffData(token); setIsRegisterModalOpen(false); }} 
                        token={token} 
                    />
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Staff Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="text-red-600 mb-4">{error}</div>
                    )}
                    
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={staff} />
                    )}
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