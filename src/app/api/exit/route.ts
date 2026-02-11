import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Rider from '@/models/Rider';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// POST /api/exit - Calculate payment amount
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { rider_id } = body;

    if (!rider_id) {
      return Response.json(
        { error: 'Rider ID is required' },
        { status: 400 }
      );
    }

    // Find active session
    const session = await ParkingSession.findOne({
      rider_id,
      status: 'INSIDE',
    }).populate('rider_id');

    if (!session) {
      return Response.json(
        { error: 'No active parking session found' },
        { status: 404 }
      );
    }

    // Calculate duration in minutes
    const exitTime = new Date();
    const entryTime = new Date(session.entry_time);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));

    // Calculate amount based on pricing rules
    // First 30 minutes = ₹20
    // More than 30 minutes = ₹30
    const amount = durationMinutes <= 30 ? 20 : 30;

    const rider = session.rider_id as any;

    return Response.json({
      success: true,
      session_id: session._id,
      rider_name: rider.name,
      vehicle_number: rider.vehicle_number,
      entry_time: session.entry_time,
      exit_time: exitTime,
      duration_minutes: durationMinutes,
      amount,
    });
  } catch (error) {
    console.error('Exit calculation error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
