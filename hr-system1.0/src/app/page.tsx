// src/app/page.tsx

'use client'
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">
        Inovera Technologies - HR Task System
      </h1>
      <p className="mb-8 text-slate-600">
        Click below to begin building your Project Task Management dashboard.
      </p>
      
      {/* Primary Button, styled with your brand's core color (Slate/Blue) */}
      <Button 
        className="text-white bg-[#0E1C36] hover:bg-slate-700" // Using Deep Navy from your brand guide
        onClick={() => alert("Button clicked! Time to build the HR Dashboard!")}
      >
        Access Project Dashboard
      </Button>

      {/* Secondary Outline Button */}
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={() => alert("Outline button clicked!")}
      >
        View Staff List
      </Button>
    </div>
  );
}