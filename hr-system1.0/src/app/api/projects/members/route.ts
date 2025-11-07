// src/app/api/projects/members/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authenticate } from '../../../lib/authMiddleware'; 

// !! IMPORTANT: Only roles that can manage projects should be able to add/remove members.
const REQUIRED_MEMBERSHIP_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID',
  'PROJECT_MANAGER_ROLE_ID'
];

// =========================================================
// POST Handler: Add Member to Project (CREATE UserProject)
// =========================================================

export async function POST(request: NextRequest) {
  // 1. RUN AUTHORIZATION
  const authResult = await authenticate(request, REQUIRED_MEMBERSHIP_ROLES);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const body = await request.json();
    const { projectId, userId } = body;

    // --- Input Validation ---
    if (!projectId || !userId) {
      return NextResponse.json(
        { message: 'Both projectId and userId are required to assign a member.' },
        { status: 400 } // Bad Request
      );
    }
    
    // 2. Prevent Duplicate Assignment: Check if the member is already on the team
    const existingMembership = await prisma.userProject.findUnique({
      where: {
        // Uses the compound unique index defined in schema.prisma: @@unique([userId, projectId])
        userId_projectId: {
          userId: userId,
          projectId: projectId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'This user is already a member of this project.' },
        { status: 409 } // Conflict
      );
    }

    // 3. Validate Project and User existence
    const [project, user] = await prisma.$transaction([
        prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: userId, isActive: true }, select: { id: true } }),
    ]);
    
    if (!project) {
        return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }
    if (!user) {
        return NextResponse.json({ message: 'User not found or is inactive.' }, { status: 404 });
    }

    // 4. Create the new membership record
    const newMembership = await prisma.userProject.create({
      data: {
        projectId,
        userId,
      },
    });

    // 5. Return a success response
    return NextResponse.json(
      { 
        message: 'User successfully added to the project team.', 
        membership: { 
             id: newMembership.id,
             projectId: newMembership.projectId, 
             userId: newMembership.userId 
        }
      },
      { status: 201 } // Created
    );
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while adding the team member.' },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE Handler: Remove Member from Project (DELETE UserProject)
// =========================================================

export async function DELETE(request: NextRequest) {
  // 1. RUN AUTHORIZATION
  const authResult = await authenticate(request, REQUIRED_MEMBERSHIP_ROLES);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const body = await request.json();
    const { projectId, userId } = body;

    // --- Input Validation ---
    if (!projectId || !userId) {
      return NextResponse.json(
        { message: 'Both projectId and userId are required to remove a member.' },
        { status: 400 } // Bad Request
      );
    }
    
    // 2. Perform the delete operation using the compound unique index
    const deletedMembership = await prisma.userProject.delete({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: projectId,
        },
      },
    });

    // 3. Return a success response
    return NextResponse.json(
      { 
        message: 'User successfully removed from the project team.', 
        membership: { 
            projectId: deletedMembership.projectId, 
            userId: deletedMembership.userId 
        }
      },
      { status: 200 } // OK
    );
  } catch (error) {
    // P2025 is the Prisma error code for "record to delete not found"
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json(
        { message: 'Membership record not found. User is not currently assigned to this project.' },
        { status: 404 }
      );
    }
    
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while removing the team member.' },
      { status: 500 }
    );
  }
}