// src/components/leave-columns.tsx

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// TypeScript interface for the data retrieved from the API
export interface LeaveRequestHistory {
    id: string;
    typeId: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: Date;
    // Data included via Prisma `include` statement
    type: {
        name: string; // The name of the leave type (e.g., "Vacation")
    };
}

// Helper function to render status badges
const StatusBadge: React.FC<{ status: LeaveRequestHistory['status'] }> = ({ status }) => {
    let className = 'text-xs font-semibold';
    if (status === 'APPROVED') {
        className = cn(className, 'bg-green-100 text-green-700 hover:bg-green-100');
    } else if (status === 'REJECTED') {
        className = cn(className, 'bg-red-100 text-red-700 hover:bg-red-100');
    } else { // PENDING
        className = cn(className, 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100');
    }

    return (
        <Badge className={className}>
            {status.replace('_', ' ')}
        </Badge>
    );
};


export const columns: ColumnDef<LeaveRequestHistory>[] = [
    {
        accessorKey: "type",
        header: "Leave Type",
        cell: ({ row }) => {
            // Access the nested `name` property
            return row.original.type.name;
        },
    },
    {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => {
            return format(row.getValue("startDate"), "MMM dd, yyyy");
        },
    },
    {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }) => {
            return format(row.getValue("endDate"), "MMM dd, yyyy");
        },
    },
    {
        accessorKey: "duration",
        header: "Duration (Days)",
        // A simple calculation for display (Note: ignores holidays/weekends, a full calculation requires server logic)
        cell: ({ row }) => {
            const start = row.original.startDate.getTime();
            const end = row.original.endDate.getTime();
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
            return diffDays;
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
        accessorKey: "submittedAt",
        header: "Submitted On",
        cell: ({ row }) => {
            return format(row.getValue("submittedAt"), "MMM dd, yyyy");
        },
    },
    // You could add an Action column here for 'View Details' later.
];