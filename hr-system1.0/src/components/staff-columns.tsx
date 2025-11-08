import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowUpDown, Pencil, MoreHorizontal, Trash2 } from "lucide-react";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---
// Interface for the full staff data (including roleId/email needed for editing)
export interface StaffMember {
    id: string;
    fullName: string;
    email: string;
    roleId: string; // <-- Added roleId for passing to the Edit Modal
    jobTitle: string | null;
    department: string | null;
    phoneNumber: string | null;
    isActive: boolean;
    createdAt: Date;
    role: {
        name: string; // The name of the role (e.g., "Staff", "HR Admin")
    };
}

// --- Action Handlers ---

// 1. Delete Handler
const handleDeleteStaff = async (staffId: string, token: string, onSuccess: () => void) => {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`/api/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete staff member.');
        }

        toast.success("Staff member deleted successfully.");
        onSuccess(); // Trigger table refresh
    } catch (error: any) {
        console.error('Staff deletion error:', error);
        toast.error("Deletion Failed", {
            description: error.message || "An unexpected error occurred during deletion.",
        });
    }
};


// --- Columns Definition Function ---
// The function now accepts the action handlers and the authentication token
export const getStaffColumns = (
    handleEditStaff: (staff: StaffMember) => void,
    handleSuccess: () => void,
    token: string,
): ColumnDef<StaffMember>[] => [
    // 1. Full Name Column
    {
        accessorKey: "fullName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Full Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.original.fullName}</div>,
    },
    // 2. Email Column
    {
        accessorKey: "email",
        header: "Email",
    },
    // 3. Role Column
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => row.original.role.name,
    },
    // 4. Job Title Column
    {
        accessorKey: "jobTitle",
        header: "Job Title",
        cell: ({ row }) => row.original.jobTitle || 'N/A',
    },
    // 5. Department Column
    {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => row.original.department || 'N/A',
    },
    // 6. Status Column
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <Badge 
                variant={row.original.isActive ? "default" : "destructive"} 
                className={row.original.isActive ? "bg-green-500 hover:bg-green-600" : ""}
            >
                {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    // 7. Actions Column (Edit/Delete)
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const staff = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        {/* Edit Button */}
                        <DropdownMenuItem 
                            onClick={() => handleEditStaff(staff)}
                            className="flex items-center space-x-2 cursor-pointer"
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit Profile</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />

                        {/* Delete Button */}
                        <DropdownMenuItem 
                            onClick={() => handleDeleteStaff(staff.id, token, handleSuccess)}
                            className="flex items-center space-x-2 text-red-600 cursor-pointer"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Staff</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];