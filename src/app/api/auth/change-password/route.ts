import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { withAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/auth/change-password
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    // Get the current user's ID from the request (authenticated by withAuth)
    // We need to access the decoded token info.
    // The withAuth middleware might need a slight adjustment or we can get it from headers if it was added there.
    // Let's assume the middleware adds user info to the request or we can decode it here again.
    
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    // For now, let's use a standard token decode or check how withAuth works.
    // I'll re-decode to be safe if I can't easily pass it.
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decoded.id;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return Response.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return Response.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash and save new password
    admin.password_hash = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return Response.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
