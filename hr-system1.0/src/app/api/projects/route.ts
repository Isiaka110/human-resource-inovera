// src/app/api/projects/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../lib/prisma';
import { authenticate, ACCESS_ROLES } from '../../lib/authMiddleware'; 
import { ProjectStatus } from '@prisma/client';

// !! IMPORTANT: Replace these placeholders with the actual MongoDB ObjectIds 
// for the 'Administrator' and 'HR Manager' roles.
const REQUIRED_PROJECT_CREATION_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID'
];

// =========================================================
// POST Handler: Create New Project (CREATE)
// =========================================================

export async function POST(request: NextRequest) {
  // 1. RUN AUTHORIZATION: Only Admin/HR Manager can create
  const authResult = await authenticate(request, REQUIRED_PROJECT_CREATION_ROLES);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the 401/403 response from middleware
  }
  
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      managerId,
      status, 
    } = body;

    // --- Basic Input Validation ---
    if (!name || !startDate || !managerId) {
      return NextResponse.json(
        { message: 'Missing required fields: name, startDate, and managerId are required.' },
        { status: 400 } // Bad Request
      );
    }
    
    // 2. Verify that the designated managerId exists and is active
    const managerExists = await prisma.user.findUnique({
        where: { id: managerId, isActive: true },
        select: { id: true },
    });
    
    if (!managerExists) {
        return NextResponse.json(
            { message: 'The specified Project Manager ID does not exist or the user is inactive.' },
            { status: 404 }
        );
    }

    // 3. Create the new project record
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate), // Convert string date to Date object
        endDate: endDate ? new Date(endDate) : undefined,
        managerId,
        // Use user's ProjectStatus enum (assuming Pending is the default)
        status: (status as ProjectStatus) || 'Pending', 
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        managerId: true,
        status: true,
        createdAt: true,
      },
    });

    // 4. Return success response
    return NextResponse.json(
      { 
        message: 'Project created successfully.', 
        project: newProject 
      },
      { status: 201 } // Created
    );
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during project creation.' },
      { status: 500 } // Internal Server Error
    );
  }
}

// =========================================================
// GET Handler: Fetch All Projects (READ)
// =========================================================

export async function GET(request: NextRequest) {
  // 1. RUN AUTHORIZATION: All authenticated users can read project list
  const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the 401/403 response from middleware
  }

  try {
    // 2. Fetch all projects
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest projects first
      },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        // Include manager's name using a relation join (Prisma handles this efficiently)
        manager: {
          select: { fullName: true, email: true },
        },
        createdAt: true,
      },
    });

    // 3. Return the project list
    return NextResponse.json(
      { projects: projects },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while fetching project data.' },
      { status: 500 } // Internal Server Error
    );
  }
}