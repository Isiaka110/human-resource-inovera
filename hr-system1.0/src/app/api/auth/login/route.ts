// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Use the standard import path
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 

// --- Environment Variable Check ---
const JWT_SECRET = process.env.JWT_SECRET; 

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
  // In a real production app, you might crash the server startup if this is missing.
}

// Ensure the JWT_SECRET is treated as a string for jwt.sign
const SECRET_KEY = JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Basic Input Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 2. User lookup: FIX - Must include 'where' and ensure passwordHash is selected
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roleId: true,
        passwordHash: true, // MUST be selected to be available for comparison
        isActive: true, // Check if the user is active
      },
    });
    
    // 3. Handle User Not Found or Inactive: FIX - Check for null
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials or user not found.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
        return NextResponse.json(
          { message: 'Account is inactive. Please contact HR.' },
          { status: 403 }
        );
    }

    // 4. Password Comparison
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials.' },
        { status: 401 }
      );
    }
    
    // 5. Define the payload
    const payload = {
      userId: user.id, 
      email: user.email,
      roleId: user.roleId, 
    };

    // 6. Generate the JWT (using the resolved SECRET_KEY)
    const token = jwt.sign(
      payload, 
      SECRET_KEY, 
      { expiresIn: '1d' } 
    );

    // 7. Successful Login: Prepare and return the response
    // Destructure to exclude passwordHash before sending user data to the client
    const { passwordHash, ...userWithoutHash } = user;

    return NextResponse.json(
      { 
        message: 'Login successful.', 
        user: userWithoutHash,
        token: token, 
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