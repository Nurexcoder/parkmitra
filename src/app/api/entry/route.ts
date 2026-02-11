import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Rider from '@/models/Rider';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// POST /api/entry - Record vehicle entry
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

    // Check if rider exists
    const rider = await Rider.findById(rider_id);
    
    if (!rider) {
      return Response.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    // Check if rider is already inside
    const activeSession = await ParkingSession.findOne({
      rider_id,
      status: 'INSIDE',
    });

    if (activeSession) {
      return Response.json(
        { 
          error: 'Vehicle already inside',
          entry_time: activeSession.entry_time,
        },
        { status: 400 }
      );
    }

    // Create new parking session
    const session = new ParkingSession({
      rider_id,
      entry_time: new Date(),
      status: 'INSIDE',
      payment_status: 'PENDING',
    });

    await session.save();

    return Response.json({
      success: true,
      message: 'Entry recorded successfully',
      session: {
        id: session._id,
        entry_time: session.entry_time,
        vehicle_number: rider.vehicle_number,
        rider_name: rider.name,
      },
    });
  } catch (error) {
    console.error('Entry error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
