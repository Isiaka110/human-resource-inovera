// src/components/admin-dashboard.tsx

import React from 'react';
import { StaffListTable } from './staff-list-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Main dashboard content component for users with HR or Admin roles.
 */
export const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            {/* 1. Dashboard Overview Cards (Placeholder) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">+5 in the last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
                        <span className="text-red-500">🔥</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                {/* ... Add more cards */}
            </div>

            {/* 2. Staff Management Section */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Staff Management</h2>
                <Link href="/staff">
                    <Button variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Manage Staff Directory
                    </Button>
                </Link>
            </div>
            
            {/* 3. Staff List Table */}
            {/* This uses the component we just finished updating */}
            <StaffListTable />
        </div>
    );
};