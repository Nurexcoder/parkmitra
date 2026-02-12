import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { withAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/auth/admins - List all admins
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    // Exclude password from the results
    const admins = await Admin.find({}, { password: 0 }).sort({ createdAt: -1 });
    return Response.json({ success: true, admins });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/auth/admins - Create/Invite new admin
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
    });

    return Response.json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
