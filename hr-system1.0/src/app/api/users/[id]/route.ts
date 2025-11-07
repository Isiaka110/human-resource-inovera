// src/app/api/users/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authenticate } from '../../../lib/authMiddleware'; // Used for role checking

// !! IMPORTANT: Replace these placeholders with the actual MongoDB ObjectIds 
// for the 'Administrator' and 'HR Manager' roles from your database.
const REQUIRED_STAFF_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID'
];

// =========================================================
// PUT Handler: Update Staff Profile (UPDATE)
// =========================================================

// The 'params' object contains the dynamic route segments (i.e., the staff ID)
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  // 1. RUN AUTHENTICATION AND AUTHORIZATION CHECK
  const authResult = await authenticate(request, REQUIRED_STAFF_ROLES);
  
  // If authentication failed, return the error response from the middleware
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const staffId = params.id;
    const body = await request.json();
    
    // Destructure only the fields allowed to be updated.
    const { 
      fullName, 
      roleId, 
      jobTitle, 
      department, 
      phoneNumber,
      isActive, // Used to enable/disable an account
    } = body;
    
    // --- Basic ID Validation ---
    if (!staffId) {
      return NextResponse.json(
        { message: 'Missing staff ID in the URL.' },
        { status: 400 }
      );
    }
    
    // 2. Prepare the data payload for partial updates
    const updateData: Record<string, any> = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (department !== undefined) updateData.department = department;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Check if there is anything to update
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json(
        { message: 'No valid fields provided for update.' },
        { status: 400 }
      );
    }

    // 3. Perform the update operation in the database
    const updatedUser = await prisma.user.update({
      where: { id: staffId },
      data: updateData,
      // 4. Select only SAFE fields to return 
      select: {
        id: true,
        fullName: true,
        email: true,
        roleId: true,
        jobTitle: true,
        department: true,
        phoneNumber: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // 5. Return a success response
    return NextResponse.json(
      { message: 'Staff profile updated successfully.', user: updatedUser },
      { status: 200 } // OK
    );

  } catch (error) {
    // Handle Prisma error for "record to update not found"
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json(
        { message: 'Staff member not found.' },
        { status: 404 }
      );
    }
    
    console.error('Staff update error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during staff profile update.' },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE Handler: Delete Staff Profile (DELETE)
// =========================================================

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  // 1. RUN AUTHENTICATION AND AUTHORIZATION CHECK
  const authResult = await authenticate(request, REQUIRED_STAFF_ROLES);
  
  // If authentication failed, return the error response from the middleware
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const staffId = params.id;
    
    if (!staffId) {
      return NextResponse.json(
        { message: 'Missing staff ID in the URL.' },
        { status: 400 } // Bad Request
      );
    }

    // 2. Perform the delete operation in the database
    const deletedUser = await prisma.user.delete({
      where: { id: staffId },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    // 3. Return a success response
    return NextResponse.json(
      { 
        message: `Staff member (${deletedUser.fullName}) deleted successfully.`, 
        id: deletedUser.id 
      },
      { status: 200 } // OK
    );

  } catch (error) {
    // Handle Prisma error for "record to delete not found"
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json(
        { message: 'Staff member not found.' },
        { status: 404 }
      );
    }
    
    console.error('Staff deletion error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during staff deletion.' },
      { status: 500 }
    );
  }
}