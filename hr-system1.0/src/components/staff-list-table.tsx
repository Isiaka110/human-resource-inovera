// src/components/staff-list-table.tsx

'use client';

import * as React from 'react';
// FIX: The columns import needs to be updated to be a function that accepts handlers
import { getStaffColumns, StaffMember } from '@/components/staff-columns'; 
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react'; 
import { StaffEditModal } from './staff-edit-modal';

// Define the full set of data required for the modal
interface FullStaffMemberData extends StaffMember {
    roleId: string; 
    email: string; 
    phoneNumber: string | null;
}

// FIX: Define a custom Session type to include the token, as it is added in your JWT callback
interface CustomUser {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    token?: string; // <--- This must be defined on the user object
}

interface CustomSession {
    user?: CustomUser;
    expires: string;
}


export function StaffListTable() {
    // FIX: Type the session data correctly to ensure 'token' is available
    const { data: session } = useSession() as { data: CustomSession | null }; 
    const authToken = session?.user?.token; // Safely extract token

    // --- State for Data and Loading ---
    const [data, setData] = React.useState<FullStaffMemberData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [refreshKey, setRefreshKey] = React.useState(0); 

    // --- State for Modal Management ---
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [currentStaff, setCurrentStaff] = React.useState<FullStaffMemberData | null>(null);

    // --- Function to fetch data (moved outside useEffect to be reusable) ---
    const fetchStaff = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // FIX: Ensure token is sent if your API requires it (though the middleware should handle it)
            const response = await fetch('/api/staff', {
                headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access Denied: You do not have HR permission to view staff data.');
                }
                throw new Error('Failed to fetch staff list.');
            }
            
            const result = await response.json();
            
            const formattedData = result.staff.map((item: any) => ({
                ...item,
                createdAt: new Date(item.createdAt),
            }));
            
            setData(formattedData);
        } catch (error) {
            toast.error('Data Load Error', {
                description: error instanceof Error ? error.message : 'Could not load staff data.',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [authToken]); // Dependency added for authToken

    // --- Data Fetch Effect ---
    React.useEffect(() => {
        // Only fetch if we have a token (or if token check is disabled for development)
        if (authToken) { 
            fetchStaff();
        }
    }, [fetchStaff, refreshKey, authToken]); 

    // --- Modal Handlers ---
    const handleEditStaff = React.useCallback((staff: FullStaffMemberData) => {
        setCurrentStaff(staff);
        setIsModalOpen(true);
    }, []);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentStaff(null);
    };
    
    // --- Render Logic ---

    if (isLoading) {
        return (
            <Card className="h-[500px] shadow-lg">
                <CardHeader><CardTitle>Staff Directory</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    // FIX 1: The columns import must be a function call if it accepts arguments.
    // FIX 2 & 3: Safely pass handlers and the token, ensuring the token is a string.
    const columnsDefinition = getStaffColumns(handleEditStaff, handleSuccess, authToken || '');

    return (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Staff Directory ({data.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable 
                        columns={columnsDefinition} 
                        data={data} 
                        filterColumn="fullName" 
                    />
                </CardContent>
            </Card>

            {/* FIX 4: Safely check for currentStaff, token, and modal state */}
            {isModalOpen && currentStaff && authToken && (
                <StaffEditModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={currentStaff}
                    onSuccess={handleSuccess}
                    token={authToken} // Pass the authenticated token
                />
            )}
        </>
    );
}