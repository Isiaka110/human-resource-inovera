// src/lib/authMiddleware.ts (Refined for App Router and Authorization)

import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';

// Define the structure of the token payload for type safety
export interface AuthenticatedUserPayload extends BaseJwtPayload {
    userId: string;
    email: string;
    roleId: string; // The MongoDB ObjectId of the user's role
}

// Get the JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';

/**
 * Validates the JWT and returns the decoded payload if successful.
 * If validation fails, it returns a NextResponse error object.
 * * @param request The incoming NextRequest object.
 * @returns {AuthenticatedUserPayload | NextResponse} The decoded user payload or an error response.
 */
export function authenticate(request: NextRequest): AuthenticatedUserPayload | NextResponse {
    // 1. JWT Secret Check
    if (JWT_SECRET === 'fallback-secret-for-dev-only-do-not-use-in-prod') {
        console.error('FATAL ERROR: JWT_SECRET environment variable is not set. Using fallback.');
        // For production, you should throw an error here.
    }

    // 2. Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
        return NextResponse.json(
            { message: 'Authentication required. No token provided.' },
            { status: 401 } // Unauthorized
        );
    }

    try {
        // 3. Verify and decode the token
        const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
        
        // 4. Success: Return the decoded payload
        return decoded;

    } catch (error) {
        // 5. Handle token verification errors (expired tokens, invalid signatures, etc.)
        console.error('Token validation error:', error);
        return NextResponse.json(
            { message: 'Authentication failed. Invalid or expired token.' },
            { status: 401 } // Unauthorized
        );
    }
}

// ----------------------------------------------------
// Authorization Utility (For use in your API route files)
// ----------------------------------------------------

/**
 * Checks if the user's role ID is included in a list of required role IDs.
 * NOTE: The logic to map role NAMES (e.g., 'HR Manager') to role IDs (ObjectIds) 
 * must be handled in the calling API route or a dedicated cache utility.
 * * @param userPayload The decoded payload from the authenticate function.
 * @param requiredRoleIds An array of MongoDB role ObjectIds that are allowed access.
 * @returns {boolean} True if authorized, false otherwise.
 */
export function authorize(userPayload: AuthenticatedUserPayload, requiredRoleIds: string[]): boolean {
    return requiredRoleIds.includes(userPayload.roleId);
}