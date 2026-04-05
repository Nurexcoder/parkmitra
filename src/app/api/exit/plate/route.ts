import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Rider from '@/models/Rider';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// POST /api/exit/plate — Calculate exit fee by vehicle plate number
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { plate_number } = body;

    if (!plate_number) {
      return Response.json({ error: 'Plate number is required' }, { status: 400 });
    }

    const normalised = (plate_number as string).replace(/[\s-]/g, '').toUpperCase();

    const riders = await Rider.find({});
    const rider = riders.find(
      (r) => r.vehicle_number.replace(/[\s-]/g, '').toUpperCase() === normalised
    );

    if (!rider) {
      return Response.json(
        { error: `No registered rider found for plate ${normalised}` },
        { status: 404 }
      );
    }

    const session = await ParkingSession.findOne({
      rider_id: rider._id,
      status: 'INSIDE',
    });

    if (!session) {
      return Response.json(
        { error: 'No active parking session found for this vehicle' },
        { status: 404 }
      );
    }

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - new Date(session.entry_time).getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const amount = durationMinutes <= 30 ? 20 : 30;

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
    console.error('Plate exit error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
