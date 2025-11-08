// src/components/staff-registration-form.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Assume these imports are correctly set up based on your Shadcn installation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react'; // Import spinner for loading state

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
        phoneNumber: '', // Initialized here
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Fetch Roles Utility (GET /api/roles) ---
    useEffect(() => {
        const fetchRoles = async () => {
            // Only fetch if a token is available
            if (!token) return; 

            try {
                const response = await fetch('/api/roles', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Assuming API returns { roles: [...] }
                    setRoles(data.roles); 
                    // Automatically select the first role if none is selected
                    if (data.roles.length > 0 && !formData.roleId) {
                        setFormData(prev => ({ ...prev, roleId: data.roles[0].id }));
                    }
                } else {
                    toast.error("Failed to load roles.", { description: "Authorization or server error." });
                }
            } catch (error) {
                 toast.error("Network Error", { description: "Could not connect to the role API." });
            }
        };
        fetchRoles();
    }, [token, formData.roleId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Submission Logic (POST /api/staff) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // FIX: Using /api/staff as the endpoint for creating a new user/staff member
            const response = await fetch('/api/staff', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success("Registration Successful", { description: "New staff member has been registered." });
                onSuccess(); // Triggers table refresh and modal closure
            } else {
                const errorData = await response.json();
                toast.error("Registration Failed", { 
                    description: errorData.message || "An unexpected error occurred during registration." 
                });
            }
        } catch (error) {
             toast.error("Network Error", { description: "Could not connect to the registration endpoint." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                
                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
                
                {/* Role Selection */}
                <div className="space-y-2">
                    <Label htmlFor="roleId">Role</Label>
                    <Select 
                        onValueChange={(value) => handleSelectChange(value, 'roleId')} 
                        value={formData.roleId} // Controlled component requires value
                        required
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.length === 0 ? (
                                <SelectItem value="" disabled>Loading roles...</SelectItem>
                            ) : (
                                roles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Job Title */}
                <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                </div>
                
                {/* Department */}
                <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" value={formData.department} onChange={handleChange} />
                </div>

                {/* Phone Number (Added missing input field) */}
                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                </div>

            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                    </>
                ) : (
                    'Register Staff'
                )}
            </Button>
        </form>
    );
};