// src/components/leave-history-table.tsx

'use client';

import * as React from 'react';
import { columns, LeaveRequestHistory } from '@/components/leave-columns';
import { DataTable } from '@/components/ui/data-table'; // <-- Assuming you have a generic DataTable component
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LeaveHistoryTable() {
    const [data, setData] = React.useState<LeaveRequestHistory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('/api/leave/history');
                if (!response.ok) {
                    throw new Error('Failed to fetch leave history');
                }
                const result = await response.json();
                
                // IMPORTANT: Dates must be converted to Date objects
                const formattedData = result.history.map((item: any) => ({
                    ...item,
                    startDate: new Date(item.startDate),
                    endDate: new Date(item.endDate),
                    submittedAt: new Date(item.submittedAt),
                }));
                
                setData(formattedData);
            } catch (error) {
                toast.error('Data Error', {
                    description: 'Could not load your leave request history.',
                });
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Leave History</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>My Leave History</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={data} filterColumn="type" />
            </CardContent>
        </Card>
    );
}