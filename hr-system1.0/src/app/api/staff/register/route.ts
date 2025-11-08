// src/app/api/staff/register/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma'; // Assuming this is your central Prisma client import
import { StaffRegistrationSchema } from '@/lib/schemas'; // Your Zod schema

// --- PLACEHOLDER FOR HR ADMIN CHECK ---
function checkAdminAccess(session: any): boolean {
    // In a real app, check session?.user?.roleId against the HR Admin role ID
    return true; 
}
// ------------------------------------------

export async function POST(req: Request) {
    // 1. Authorization Check (Only HR/Admin can register new staff)
    const session = await getServerSession(/* Add your auth options here */);

    if (!checkAdminAccess(session)) {
        return NextResponse.json({ message: "Forbidden: HR Admin access required." }, { status: 403 });
    }

    try {
        const body = await req.json();

        // 2. Data Validation using Zod
        const validatedData = StaffRegistrationSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ 
                message: "Validation Failed", 
                errors: validatedData.error.flatten().fieldErrors 
            }, { status: 400 });
        }

        const { fullName, email, password, roleId, jobTitle, department, phoneNumber } = validatedData.data;

        // 3. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email },
        });

        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
        }

        // 4. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // 5. Database Write (Create New User)
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash: hashedPassword, // Save the hashed password
                roleId,
                jobTitle,
                department,
                phoneNumber,
                // isActive defaults to true
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                roleId: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ 
            message: "Staff member registered successfully.", 
            user: newUser 
        }, { status: 201 });

    } catch (error) {
        console.error('Staff Registration Error:', error);
        return NextResponse.json({ 
            message: "Internal Server Error during registration.", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}