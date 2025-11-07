// src/app/api/projects/[id]/members/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../../lib/prisma';
import { authenticate, ACCESS_ROLES } from '../../../../lib/authMiddleware'; 

// =========================================================
// GET Handler: Fetch Team Members for a Specific Project
// =========================================================

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  // 1. RUN AUTHORIZATION: All authenticated users can view project teams
  const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { message: 'Missing project ID in the URL.' },
        { status: 400 } // Bad Request
      );
    }
    
    // 2. Validate Project existence (optional but recommended)
    const projectExists = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
    });
    
    if (!projectExists) {
        return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    // 3. Fetch all UserProject records for the given projectId
    const projectMemberships = await prisma.userProject.findMany({
      where: { projectId: projectId },
      // 4. Eager-load the related User data
      select: {
        user: { 
          select: {
            id: true,
            fullName: true,
            email: true,
            jobTitle: true,
            department: true,
            isActive: true,
            // Include the related Role details
            role: {
              select: { name: true }
            }
          }
        }
      },
    });

    // 5. Clean up the data: Extract the User object from the membership wrapper
    const teamMembers = projectMemberships.map(membership => ({
        ...membership.user,
        roleName: membership.user.role.name // Flatten the role name for easy use
    }));

    // 6. Return the list of team members
    return NextResponse.json(
      { 
        projectId: projectId,
        members: teamMembers 
      },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Fetch team members error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while fetching the team members.' },
      { status: 500 }
    );
  }
}