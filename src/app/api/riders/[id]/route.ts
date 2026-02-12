import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Rider from '@/models/Rider';
import ParkingSession from '@/models/ParkingSession';
import { withAuth, JWTPayload } from '@/lib/auth';

// GET /api/riders/[id] - Fetch single rider
export const GET = withAuth(async (request: NextRequest, admin: JWTPayload, { params }: { params: { id: string } }) => {
  try {
    await connectDB();
    const rider = await Rider.findById(params.id);
    
    if (!rider) {
      return Response.json({ error: 'Rider not found' }, { status: 404 });
    }

    return Response.json({ success: true, rider });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PUT /api/riders/[id] - Update rider details
export const PUT = withAuth(async (request: NextRequest, admin: JWTPayload, { params }: { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await request.json();
    const { name, phone, vehicle_number, email } = body;

    // Check if vehicle number exists for another rider
    if (vehicle_number) {
      const existing = await Rider.findOne({ 
        vehicle_number: vehicle_number.toUpperCase(),
        _id: { $ne: params.id }
      });
      if (existing) {
        return Response.json({ error: 'Vehicle number already exists' }, { status: 400 });
      }
    }

    const updatedRider = await Rider.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(vehicle_number && { vehicle_number: vehicle_number.toUpperCase() }),
        ...(email && { email }),
      },
      { new: true }
    );

    if (!updatedRider) {
      return Response.json({ error: 'Rider not found' }, { status: 404 });
    }

    return Response.json({ success: true, rider: updatedRider });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// DELETE /api/riders/[id] - Delete rider
export const DELETE = withAuth(async (request: NextRequest, admin: JWTPayload, { params }: { params: { id: string } }) => {
  try {
    await connectDB();
    
    const deletedRider = await Rider.findByIdAndDelete(params.id);
    
    if (!deletedRider) {
      return Response.json({ error: 'Rider not found' }, { status: 404 });
    }

    return Response.json({ success: true, message: 'Rider deleted successfully' });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
