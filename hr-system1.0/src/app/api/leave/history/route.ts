// src/app/api/leave/history/route.ts

import { NextResponse, NextRequest } from 'next/server'; // Use NextRequest for middleware
import prisma from '../../../lib/prisma'; // Use the central Prisma client
import { authenticate, ACCESS_ROLES } from '../../../lib/authMiddleware'; 
import { JwtPayload } from 'jsonwebtoken'; // For type safety

// =========================================================
// GET Handler: Fetch User's Leave History
// =========================================================

/**
 * Handles GET requests to fetch the leave history for the logged-in user.
 * Requires ALL_AUTHENTICATED role.
 */
export async function GET(request: NextRequest) {
    // 1. Authentication Check
    const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
    
    if (authResult instanceof NextResponse) {
        return authResult; // Returns 401 Unauthorized
    }
    
    // Extract User ID from the successful authentication result
    const authenticatedUser = authResult.user as JwtPayload; 
    const userId = authenticatedUser.id; // Assuming 'id' holds the MongoDB user ID

    if (!userId) {
        return NextResponse.json({ 
            message: "Unauthorized: User ID is missing from the authentication token.", 
        }, { status: 403 });
    }

    try {
        // 2. Fetch Leave Requests for the specific user
        // Temporary FIX: Using (prisma as any) to bypass the TypeScript cache issue.
        const leaveHistory = await (prisma as any).leaveRequest.findMany({
            where: {
                userId: userId,
            },
            // Include the related LeaveType name for display in the table
            include: {
                type: {
                    select: {
                        name: true,
                    },
                },
            },
            // Order newest requests first
            orderBy: {
                submittedAt: 'desc',
            }
        });

        // 3. Return the data
        return NextResponse.json({ 
            history: leaveHistory 
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching leave history:', error);
        return NextResponse.json({ 
            message: "Internal Server Error: Failed to retrieve leave history.", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}