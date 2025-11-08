// src/app/api/leave/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../lib/prisma';
import { LeaveRequestSchema } from '@/lib/schemas'; 
import { authenticate, ACCESS_ROLES } from '../../lib/authMiddleware'; 
import { JwtPayload } from 'jsonwebtoken'; // Assuming your auth token uses JwtPayload structure or similar

// Define a type for the successful authentication result, based on the error message
// We assume authResult is an object containing the user data (JwtPayload)
interface AuthSuccessResult {
    isAuthenticated: boolean;
    user: JwtPayload; // This is the object containing user details from the token
}

// =========================================================
// POST Handler: Submit New Leave Request (Authenticated User)
// =========================================================

/**
 * Handles the creation of a new leave request. Requires ALL_AUTHENTICATED role.
 */
export async function POST(request: NextRequest) {
    // 1. Authentication Check: Ensure user is logged in
    const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
    
    // Check if the result is a NextResponse (failure)
    if (authResult instanceof NextResponse) {
        return authResult; // Returns 401 Unauthorized
    }

    // FIX 1: Accessing User ID Safely
    // Based on your error message, the authenticated data is accessed via a 'user' property.
    // The ID must exist directly on the 'user' object within the success result.
    const authenticatedUser = authResult.user as JwtPayload; // Cast to access token payload properties
    
    // Assuming your JWT payload (JwtPayload) contains the user's ID as 'id' or 'userId'
    const userId = authenticatedUser.id; 
    
    if (!userId) {
        return NextResponse.json({ 
            message: "Authentication failed: User ID is missing from the authentication token payload.",
        }, { status: 403 }); 
    }

    try {
        const body = await request.json();

        // 2. Data Validation using Zod
        const validatedData = LeaveRequestSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ 
                message: "Validation Failed", 
                errors: validatedData.error.flatten().fieldErrors 
            }, { status: 400 });
        }

        const { dateRange, reason, typeId } = validatedData.data;

        // 3. Database Write (Create LeaveRequest)
        // FIX 2: This code is correct, but the *type system* is still broken.
        // We add a temporary type assertion (`as any`) as a last resort *only* // until the Prisma type regeneration is confirmed to have worked.
        const newLeaveRequest = await (prisma as any).leaveRequest.create({ 
            data: {
                userId: userId, 
                typeId: typeId, 
                startDate: dateRange.from,
                endDate: dateRange.to,
                reason: reason,
                // status defaults to PENDING per schema
            }
        });

        return NextResponse.json({ 
            message: "Leave request submitted successfully.", 
            request: newLeaveRequest 
        }, { status: 201 });

    } catch (error) {
        console.error('Leave Submission Error:', error);

        return NextResponse.json({ 
            message: "Internal Server Error during leave submission.", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}