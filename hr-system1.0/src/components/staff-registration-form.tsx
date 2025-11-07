// src/components/staff-registration-form.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner'; // <-- UPDATED: Import toast function directly from Sonner

// Assume these imports are correctly set up based on your Shadcn installation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// REMOVED: import { useToast } from '@/components/ui/use-toast'; // For notifications

interface Role {
    id: string;
    name: string;
}

interface StaffRegistrationFormProps {
    onSuccess: () => void;
    token: string;
}

export const StaffRegistrationForm: React.FC<StaffRegistrationFormProps> = ({ onSuccess, token }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        roleId: '',
        jobTitle: '',
        department: '',
        phoneNumber: '',
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // REMOVED: const { toast } = useToast(); // Sonner does not use a hook

    // --- Fetch Roles Utility (GET /api/roles) ---
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
        fetchRoles();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Submission Logic (POST /api/users) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });

        setIsLoading(false);

        if (response.ok) {
            // UPDATED: Use Sonner syntax
            toast.success("New staff member registered.");
            onSuccess(); // Re-fetch staff list and close modal
        } else {
            const errorData = await response.json();
            // UPDATED: Use Sonner syntax
            toast.error(errorData.message || "An unexpected error occurred.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
                
                {/* Role Selection */}
                <div className="space-y-2">
                    <Label htmlFor="roleId">Role</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, 'roleId')} required>
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
                    <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" value={formData.department} onChange={handleChange} />
                </div>
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register Staff'}
            </Button>
        </form>
    );
};