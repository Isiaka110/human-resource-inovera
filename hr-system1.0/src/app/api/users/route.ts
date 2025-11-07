// src/app/api/users/route.ts (UPDATED WITH AUTHORIZATION)

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../lib/authMiddleware'; // <-- NEW IMPORT

// --- Define the Required Role IDs ---
// !! IMPORTANT: Replace these placeholders with the actual MongoDB ObjectIds for your roles.
const REQUIRED_STAFF_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID'
];


// =========================================================
// POST Handler: Staff Registration (CREATE)
// =========================================================

export async function POST(request: NextRequest) {
  // 1. RUN AUTHENTICATION AND AUTHORIZATION CHECK
  const authResult = await authenticate(request, REQUIRED_STAFF_ROLES);
  
  // If authentication failed, return the error response from the middleware
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Auth successful! Now proceed with the original logic...
  
  try {
    // ... (rest of the POST logic from before)
    const body = await request.json();
    const { 
      fullName, 
      email, 
      password, 
      roleId, 
      jobTitle, 
      department, 
      phoneNumber 
    } = body;
    
    // ... (Input validation and user checks here)
    
    // 2. Hash and create user (same as before)
    const salt = await bcrypt.genSalt(10); 
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        roleId, 
        jobTitle,
        department,
        phoneNumber,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        roleId: true,
        jobTitle: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'Staff member registered successfully.', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    // ... (error handling here)
    console.error('Staff registration error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during registration.' },
      { status: 500 }
    );
  }
}


// =========================================================
// GET Handler: Fetch All Staff (READ)
// =========================================================

export async function GET(request: NextRequest) {
  // 1. RUN AUTHENTICATION AND AUTHORIZATION CHECK
  const authResult = await authenticate(request, REQUIRED_STAFF_ROLES);
  
  // If authentication failed, return the error response from the middleware
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Auth successful! Now proceed with the original logic...
  
  try {
    // 2. Fetch all users from the 'users' collection (same as before)
    const users = await prisma.user.findMany({
      orderBy: {
        fullName: 'asc', 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        roleId: true,
        jobTitle: true,
        department: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { users: users },
      { status: 200 }
    );
  } catch (error) {
    // ... (error handling here)
    console.error('Staff fetch error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while fetching staff data.' },
      { status: 500 }
    );
  }
}