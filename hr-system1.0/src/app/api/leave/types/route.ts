// src/app/api/leave/types/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client outside the handler
const prisma = new PrismaClient();

/**
 * Handles GET requests to fetch all available leave types.
 * @returns A JSON response containing the list of LeaveType objects.
 */
export async function GET() {
    try {
        // 1. Fetch all leave types from the database
        const leaveTypes = await prisma.leaveType.findMany({
            // Select only the necessary fields for the dropdown
            select: {
                id: true,
                name: true,
            },
            // Optionally order them alphabetically
            orderBy: {
                name: 'asc',
            }
        });

        // 2. Return the data
        return NextResponse.json({ 
            types: leaveTypes 
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching leave types:', error);
        
        // 3. Handle errors
        return NextResponse.json({ 
            message: "Internal Server Error: Failed to retrieve leave types.", 
            error: error instanceof Error ? error.message : 'Unknown database error'
        }, { status: 500 });
    }
}