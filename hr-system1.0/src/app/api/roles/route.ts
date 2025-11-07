// src/app/api/roles/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../lib/prisma';
import { authenticate, ACCESS_ROLES } from '../../lib/authMiddleware'; 

// =========================================================
// GET Handler: Fetch All Roles (READ)
// =========================================================

export async function GET(request: NextRequest) {
  // 1. RUN AUTHORIZATION: Allow all authenticated users to read the roles list
  const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // 2. Fetch all role records from the database
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc', // Sort alphabetically
      },
      select: {
        id: true,
        name: true,
      },
    });

    // 3. Return the list of roles
    return NextResponse.json(
      { roles: roles },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Fetch roles error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while fetching role data.' },
      { status: 500 } // Internal Server Error
    );
  }
}