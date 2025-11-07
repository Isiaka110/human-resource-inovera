// src/lib/authMiddleware.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Define the structure of the token payload for type safety
interface JwtPayload {
  userId: string;
  email: string;
  roleId: string; // The role ID stored in MongoDB
}

// Get the JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// --- Define Permissions ---
// We will define a list of roles that are allowed to access certain resources.
// In a full system, these would be managed in the database, but we start simple.
export const ACCESS_ROLES = {
  // Roles allowed to create/read staff (e.g., POST and GET /api/users)
  STAFF_MANAGEMENT: ['Administrator', 'HR Manager'],
  // Roles allowed to manage projects (e.g., POST and PUT /api/projects)
  PROJECT_MANAGEMENT: ['Administrator', 'Project Manager'],
  // Everyone (used for basic viewing)
  ALL_AUTHENTICATED: ['Administrator', 'HR Manager', 'Project Manager', 'Employee'],
};


// ----------------------------------------------------
// Core Middleware Function
// ----------------------------------------------------

// This is a higher-order function that takes the required role IDs and returns the actual middleware.
// NOTE: Since we are using MongoDB, we will check the 'roleId' against the IDs that belong to the required role names. 
// For now, we will assume you have the actual MongoDB ObjectIds for these roles ready.
export async function authenticate(request: NextRequest, requiredRoleIds: string[] = ACCESS_ROLES.ALL_AUTHENTICATED) {
  // 1. Get the token from the Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json(
      { message: 'Authentication failed. No token provided.' },
      { status: 401 } // Unauthorized
    );
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET is missing. Cannot verify token.');
    return NextResponse.json(
      { message: 'Server configuration error.' },
      { status: 500 }
    );
  }

  try {
    // 2. Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // 3. Authorization Check: Verify the user's role ID against the required IDs
    const userRoleId = decoded.roleId;

    if (!requiredRoleIds.includes(userRoleId)) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have the required role to access this resource.' },
        { status: 403 } // Forbidden
      );
    }
    
    // 4. Success: Attach the decoded user data to the request (if needed later)
    // NOTE: In Next.js App Router, modifying the request object is complex. 
    // We mainly rely on the success/failure response here.
    
    // Return the decoded payload to the route handler for use (e.g., logging)
    return {
      isAuthenticated: true,
      user: decoded
    };
    
  } catch (error) {
    // This catches expired tokens, invalid signatures, etc.
    console.error('Token validation error:', error);
    return NextResponse.json(
      { message: 'Authentication failed. Invalid or expired token.' },
      { status: 401 } // Unauthorized
    );
  }
}