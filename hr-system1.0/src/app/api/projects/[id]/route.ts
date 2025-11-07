// src/app/api/projects/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authenticate } from '../../../lib/authMiddleware'; 
import { ProjectStatus } from '@prisma/client';

// !! IMPORTANT: Only Admin/HR Manager can update project details
const REQUIRED_PROJECT_CREATION_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID'
];

// Define the PUT handler function for updating a specific project
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  // 1. RUN AUTHENTICATION AND AUTHORIZATION CHECK
  const authResult = await authenticate(request, REQUIRED_PROJECT_CREATION_ROLES);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const projectId = params.id;
    const body = await request.json();
    
    // Destructure all potentially updatable fields
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      managerId,
      status,
    } = body;
    
    if (!projectId) {
      return NextResponse.json({ message: 'Missing project ID in the URL.' }, { status: 400 });
    }
    
    // 2. Prepare the data payload for partial updates
    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null; // Set to null to clear if empty
    
    if (status !== undefined) {
      // Basic check to ensure the status provided is a valid enum value
      if (Object.keys(ProjectStatus).includes(status)) {
        updateData.status = status;
      }
    }
    
    // If managerId is updated, check if the new manager exists
    if (managerId !== undefined) {
        const managerExists = await prisma.user.findUnique({
            where: { id: managerId, isActive: true },
            select: { id: true },
        });
        
        if (!managerExists) {
            return NextResponse.json(
                { message: 'The specified new Project Manager ID does not exist or the user is inactive.' },
                { status: 404 } 
            );
        }
        updateData.managerId = managerId;
    }
    
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    // 3. Perform the update operation
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      select: {
        id: true,
        name: true,
        status: true,
        managerId: true,
        updatedAt: true,
      },
    });

    // 4. Return success response
    return NextResponse.json(
      { message: 'Project updated successfully.', project: updatedProject },
      { status: 200 } // OK
    );

  } catch (error) {
    // Handle Prisma error for "record to update not found" (P2025)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }
    
    console.error('Project update error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during project update.' },
      { status: 500 }
    );
  }
}