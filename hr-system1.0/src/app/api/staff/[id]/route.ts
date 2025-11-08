// src/app/api/staff/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authenticate, ACCESS_ROLES } from '../../../lib/authMiddleware';
// FIX 1: Corrected schema import name from StaffUpdateSchema to StaffEditSchema
import { StaffEditSchema } from '@/lib/schemas'; 
import { Prisma } from '@prisma/client'; // Import Prisma for error handling

// Define props structure for Next.js dynamic routes
interface Params {
    params: {
        id: string;
    };
}

// =========================================================
// PUT Handler: Update Staff Details
// =========================================================
/**
 * Updates details for a specific staff member. Requires HR_ADMIN role.
 */
export async function PUT(request: NextRequest, { params }: Params) {
    // 1. Authorization: Only allow HR_ADMIN to update staff records
    // FIX 2: Corrected ACCESS_ROLES property name from HR_ADMIN to STAFF_MANAGEMENT (or your actual defined HR role)
    const authResult = await authenticate(request, ACCESS_ROLES.STAFF_MANAGEMENT); 
    
    if (authResult instanceof NextResponse) {
        return authResult;
    }
    
    const staffId = params.id;

    try {
        const body = await request.json();

        // 2. Validation: Use the correct schema name
        const validatedData = StaffEditSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ 
                message: "Validation Failed", 
                errors: validatedData.error.flatten().fieldErrors 
            }, { status: 400 });
        }

        // 3. Update the user record
        const updatedUser = await prisma.user.update({
            where: { id: staffId },
            data: {
                fullName: validatedData.data.fullName,
                roleId: validatedData.data.roleId,
                jobTitle: validatedData.data.jobTitle,
                department: validatedData.data.department,
                phoneNumber: validatedData.data.phoneNumber,
                isActive: validatedData.data.isActive,
            },
        });

        return NextResponse.json({ 
            message: "Staff member updated successfully.", 
            user: updatedUser 
        }, { status: 200 });

    } catch (error) {
        // FIX 4: Improved error handling for unknown type
        console.error(`Staff Update Error for ID ${staffId}:`, error);
        return NextResponse.json({ 
            message: "Internal Server Error during staff update.", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// =========================================================
// DELETE Handler: Delete Staff Member
// =========================================================
/**
 * Deletes a staff member record. Requires HR_ADMIN role.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
    // 1. Authorization: Only allow HR_ADMIN to delete staff records
    // FIX 2: Corrected ACCESS_ROLES property name
    const authResult = await authenticate(request, ACCESS_ROLES.STAFF_MANAGEMENT);
    
    if (authResult instanceof NextResponse) {
        return authResult;
    }
    
    const staffId = params.id;

    try {
        // 2. Delete the user record
        await prisma.user.delete({
            where: { id: staffId },
        });

        return NextResponse.json({ 
            message: "Staff member deleted successfully." 
        }, { status: 200 });

    } catch (error) {
        // FIX 3: Use instanceof to safely check for Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { 
            return NextResponse.json({ 
                message: "Staff member not found." 
            }, { status: 404 });
        }

        console.error(`Staff Delete Error for ID ${staffId}:`, error);
        return NextResponse.json({ 
            message: "Internal Server Error during staff deletion.", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}