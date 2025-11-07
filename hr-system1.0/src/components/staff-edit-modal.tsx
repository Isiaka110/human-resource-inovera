// src/components/staff-edit-modal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner'; // <-- UPDATED: Import Sonner's toast function directly

// Assume these imports are correctly set up based on your Shadcn installation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
// REMOVED: import { useToast } from '@/components/ui/use-toast';

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
    const [formData, setFormData] = useState(initialData);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // REMOVED: const { toast } = useToast(); // Sonner does not use a hook

    // Update form data when initialData prop changes (i.e., when a new user is selected for edit)
    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    // Fetch Roles Utility (same as registration form)
    useEffect(() => {
        const fetchRoles = async () => {
            const response = await fetch('/api/roles', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data.roles);
            }
        };
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Submission Logic (PUT /api/users/[id]) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Remove email/id/password from the payload, as they are not updated via the PUT endpoint
        const { id, email, ...updatePayload } = formData;

        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updatePayload),
        });

        setIsLoading(false);

        if (response.ok) {
            // UPDATED: Use Sonner syntax
            toast.success(`${formData.fullName}'s profile updated.`);
            onSuccess();
            onClose();
        } else {
            const errorData = await response.json();
            // UPDATED: Use Sonner syntax
            toast.error(errorData.message || "An unexpected error occurred.");
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
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            {/* Email is typically read-only or updated via a separate flow */}
                            <Input id="email" name="email" type="email" value={formData.email} disabled /> 
                        </div>
                        
                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="roleId">Role</Label>
                            <Select onValueChange={(value) => handleSelectChange(value, 'roleId')} value={formData.roleId} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job Title</Label>
                            <Input id="jobTitle" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" name="department" value={formData.department || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 flex items-center justify-between col-span-2 pt-4">
                            <Label htmlFor="isActive" className="text-base">Active Status</Label>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving Changes...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};