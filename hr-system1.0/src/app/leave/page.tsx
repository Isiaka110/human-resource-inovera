// src/app/leave/page.tsx

import { LeaveRequestForm } from '@/components/leave-request-form';
import { LeaveHistoryTable } from '@/components/leave-history-table'; // <-- NEW IMPORT

export default function LeaveManagementPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Left Column for the Form (takes 3/7 columns) */}
        <div className="lg:col-span-3">
          <LeaveRequestForm />
        </div>

        {/* Right Column for Request History (takes 4/7 columns) */}
        <div className="lg:col-span-4">
          {/* Replaced the placeholder div with the actual component */}
          <LeaveHistoryTable /> 
        </div>
      </div>
    </div>
  );
}