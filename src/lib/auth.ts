import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

export interface JWTPayload {
  adminId: string;
  email: string;
}

// Generate JWT token
export function generateToken(adminId: string, email: string): string {
  return jwt.sign(
    { adminId, email } as JWTPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Get admin from request
export function getAdminFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Middleware to protect routes
export function withAuth(handler: (request: NextRequest, admin: JWTPayload, context: any) => Promise<Response>) {
  return async (request: NextRequest, context: any) => {
    const admin = getAdminFromRequest(request);
    
    if (!admin) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, admin, context);
  };
}
