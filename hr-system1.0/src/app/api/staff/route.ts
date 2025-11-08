// src/app/api/staff/route.ts

import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest for middleware compatibility
import prisma from '../../lib/prisma'; // Use the central Prisma client
import { authenticate, ACCESS_ROLES } from '../../lib/authMiddleware'; // Use custom auth middleware

// =========================================================
// GET Handler: Fetch All Staff (Admin View)
// =========================================================

/**
 * Fetches a list of all staff members. Requires STAFF_MANAGEMENT role.
 */
export async function GET(request: NextRequest) {
    // 1. Authorization Check: Use middleware to restrict access to HR Admins
    const authResult = await authenticate(request, ACCESS_ROLES.STAFF_MANAGEMENT);
    
    if (authResult instanceof NextResponse) {
        return authResult; // Returns 403 Forbidden or 401 Unauthorized
    }

    try {
        // 2. Fetch all User records
        const staffList = await prisma.user.findMany({
            // Select specific fields for the data table
            select: {
                id: true,
                fullName: true,
                email: true,
                jobTitle: true,
                department: true,
                phoneNumber: true,
                isActive: true,
                createdAt: true,
                roleId: true, // Included for consistency and editing
                // Include the related Role name and ID
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            // Order by full name for better presentation
            orderBy: {
                fullName: 'asc', 
            }
        });

        // 3. Return the data
        return NextResponse.json({ 
            staff: staffList 
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching staff list:', error);
        return NextResponse.json({ 
            message: "Internal Server Error: Failed to retrieve staff data.", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// NOTE: The POST (Registration) logic is still handled separately in:
// src/app/api/staff/register/route.ts