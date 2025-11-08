// src/components/staff-dashboard.tsx

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList } from 'lucide-react';

/**
 * Main dashboard content component for regular staff users.
 */
export const StaffDashboard = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Request Time Off</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            View your leave balance and submit new requests.
                        </p>
                        <Link href="/leave">
                            <Button variant="outline" className="w-full">
                                Go to Leave Portal
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Tasks & Projects</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            See your assigned tasks and project deadlines.
                        </p>
                        <Link href="/tasks">
                            <Button variant="outline" className="w-full">
                                View Tasks
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                {/* ... Add more cards */}
            </div>
            
            <h2 className="text-2xl font-semibold tracking-tight pt-4">Recent Activity</h2>
            
            {/* Placeholder for activity feed / announcements */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Announcements</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No new announcements today.</p>
                </CardContent>
            </Card>
        </div>
    );
};