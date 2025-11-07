// src/app/api/auth/login/route.ts (UPDATED)

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // <-- NEW IMPORT

// --- Environment Variable Check ---
// IMPORTANT: Ensure this variable is set in Vercel and your local .env file
const JWT_SECRET = process.env.JWT_SECRET; 

if (!JWT_SECRET) {
  // Fail fast if the secret is missing (only for development checks)
  console.error("JWT_SECRET environment variable is not set.");
  // Throw an error or handle gracefully in production
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // ... (Steps 1, 2, 3, 4: Validation, User lookup, Password comparison - NO CHANGE)

    const user = await prisma.user.findUnique({
      // ... (existing query, including passwordHash: true)
    });
    
    // (Password validation logic here...)

    // --- NEW JWT GENERATION LOGIC ---
    
    // 5. Define the payload (the data we embed in the token)
    const payload = {
      // Use the database ID (MongoDB ObjectId)
      userId: user.id, 
      email: user.email,
      roleId: user.roleId, // Crucial for Role-Based Access Control (RBAC)
    };

    // 6. Generate the JWT (signed with the secret key)
    const token = jwt.sign(
      payload, 
      JWT_SECRET!, // Use the secret key
      { expiresIn: '1d' } // Token expires in 1 day (standard practice)
    );

    // 7. Successful Login: Prepare and return the response
    const { passwordHash, ...userWithoutHash } = user;

    return NextResponse.json(
      { 
        message: 'Login successful.', 
        user: userWithoutHash,
        token: token, // <-- RETURN THE JWT HERE
        expiresIn: '1d' 
      },
      { status: 200 } 
    );
  } catch (error) {
    console.error('Login process error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during login.' },
      { status: 500 }
    );
  }
}