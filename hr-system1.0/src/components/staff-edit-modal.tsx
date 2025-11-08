// src/components/staff-edit-modal.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner'; 
import { Loader2 } from 'lucide-react'; // Import for loading spinner

// Assume these imports are correctly set up based on your Shadcn installation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface Role {
    id: string;
    name: string;
}

interface StaffMemberData {
    id: string;
    fullName: string;
    email: string;
    roleId: string;
    jobTitle: string | null;
    department: string | null;
    phoneNumber: string | null;
    isActive: boolean;
}

interface StaffEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: StaffMemberData; // Data of the staff member being edited
    onSuccess: () => void;
    token: string;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({ isOpen, onClose, initialData, onSuccess, token }) => {
    // Ensure initial state handles null values gracefully for form fields
    const [formData, setFormData] = useState({
        ...initialData,
        jobTitle: initialData.jobTitle ?? '',
        department: initialData.department ?? '',
        phoneNumber: initialData.phoneNumber ?? '',
    } as Omit<StaffMemberData, 'jobTitle' | 'department' | 'phoneNumber'> & { jobTitle: string; department: string; phoneNumber: string });

    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRolesLoading, setIsRolesLoading] = useState(true);

    // Update form data when initialData prop changes
    useEffect(() => {
        setFormData({
            ...initialData,
            jobTitle: initialData.jobTitle ?? '',
            department: initialData.department ?? '',
            phoneNumber: initialData.phoneNumber ?? '',
        });
    }, [initialData]);

    // Fetch Roles Utility
    useEffect(() => {
        const fetchRoles = async () => {
            setIsRolesLoading(true);
            try {
                const response = await fetch('/api/roles', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setRoles(data.roles);
                } else {
                    toast.error("Failed to load roles.");
                }
            } catch (error) {
                toast.error("Network error when fetching roles.");
            } finally {
                setIsRolesLoading(false);
            }
        };
        // Fetch roles only when the modal is opened
        if (isOpen && token) {
            fetchRoles();
        }
    }, [isOpen, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string, name: keyof StaffMemberData) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Submission Logic (PUT /api/staff/[id]) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Prepare payload: exclude 'id' and 'email' as per API design
        // The API only expects fields that can be updated
        const { id, email, ...updatePayload } = formData;

        try {
            // CORRECTED ENDPOINT: Use /api/staff/[id]
            const response = await fetch(`/api/staff/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });

            if (response.ok) {
                toast.success(`Staff member ${formData.fullName}'s profile updated successfully.`);
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "An unexpected error occurred during update.");
            }
        } catch (error) {
            console.error('Staff update error:', error);
            toast.error("A network error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Staff: {initialData.fullName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 1. Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>
                        {/* 2. Email (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} disabled /> 
                        </div>
                        
                        {/* 3. Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="roleId">Role</Label>
                            <Select 
                                onValueChange={(value) => handleSelectChange(value, 'roleId')} 
                                value={formData.roleId} 
                                disabled={isRolesLoading} // Disable while roles are loading
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isRolesLoading ? (
                                        <SelectItem value="" disabled>Loading roles...</SelectItem>
                                    ) : (
                                        roles.map(role => (
                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 4. Job Title */}
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job Title</Label>
                            {/* Use local state value for form input */}
                            <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                        </div>
                        {/* 5. Department */}
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" name="department" value={formData.department} onChange={handleChange} />
                        </div>
                         {/* 6. Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                        </div>

                        {/* 7. Active Status */}
                        <div className="space-y-2 flex items-center justify-between col-span-2 p-4 border rounded-md">
                            <div className="flex flex-col">
                                <Label htmlFor="isActive" className="text-base">Active Account Status</Label>
                                <span className="text-sm text-muted-foreground">
                                    {formData.isActive ? 'Staff account is currently active.' : 'Staff account is currently locked (inactive).'}
                                </span>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => handleSelectChange(checked as unknown as string, 'isActive')}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                    Saving Changes...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};