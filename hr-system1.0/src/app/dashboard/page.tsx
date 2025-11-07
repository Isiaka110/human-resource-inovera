// src/app/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Importing hypothetical Shadcn components we would use:
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Card component
import { Button } from '@/components/ui/button'; // Button component
import { Skeleton } from '@/components/ui/skeleton'; // Skeleton for loading states

// Define the shape of a simple Project (for display)
interface Project {
  id: string;
  name: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const [userName, setUserName] = useState<string>('Staff Member');
  const [userRole, setUserRole] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // --- 1. Authentication Check and Data Fetch ---
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    if (!token) {
      // If no token exists, redirect to login
      router.push('/login');
      return;
    }
    
    // Set basic user info from storage
    setUserRole(role || 'Employee');

    // Fetch secured data (Example: Get all projects)
    fetchSecuredData(token);
  }, [router]);

  // Function to call a secure API endpoint
  const fetchSecuredData = async (token: string) => {
    try {
      // Calling your secured GET /api/projects route
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Pass the JWT for authorization
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If the token is expired or invalid, the API returns 401/403
        if (response.status === 401 || response.status === 403) {
          handleLogout(); // Force logout if token is invalid
          return;
        }
        throw new Error('Failed to fetch projects.');
      }

      const data = await response.json();
      setProjects(data.projects.slice(0, 3)); // Display first 3 projects
      
      // Optional: Fetch user's full name from another secure endpoint if needed
      // For now, we'll set a generic name.
      setUserName('Welcome, ' + role + '!'); 
      
    } catch (error) {
      console.error('Data fetching error:', error);
      // You can keep the user logged in but show an error message
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- 2. Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  // --- 3. Render Logic ---
  return (
    <div className="container p-8">
      <div className="flex justify-between items-center mb-6">
        {/* Placeholder for a custom HR Dashboard title/logo using Shadcn typography/layout */}
        <h1 className="text-3xl font-bold">HR Project Dashboard 📊</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Main Welcome Card */}
        <Card className="col-span-1 md:col-span-2 bg-blue-50">
          <CardHeader>
            <CardTitle>{userName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are logged in as a **{userRole}**.</p>
            <p>Use the navigation to manage staff, projects, and tasks based on your assigned permissions.</p>
          </CardContent>
        </Card>
        
        {/* Quick Stats Card (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-4 w-[200px]" /> : <p className="text-2xl font-semibold">12 Active Staff</p>}
            <p className="text-sm text-gray-500">Total staff in the system</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List Card (Secured Data Display) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Show skeleton loader while fetching
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <ul className="list-disc ml-5 space-y-2">
              {projects.length > 0 ? (
                projects.map(project => (
                  <li key={project.id}>
                    **{project.name}** - Status: <span className={`font-semibold ${project.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>({project.status})</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No projects found or you lack permission to view.</p>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;