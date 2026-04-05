import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Rider from '@/models/Rider';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// POST /api/entry/plate — Record entry by vehicle plate number
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { plate_number } = body;

    if (!plate_number) {
      return Response.json({ error: 'Plate number is required' }, { status: 400 });
    }

    // Normalise: remove spaces/dashes, uppercase
    const normalised = (plate_number as string).replace(/[\s-]/g, '').toUpperCase();

    // Match against stored vehicle numbers (also normalised)
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

    const activeSession = await ParkingSession.findOne({
      rider_id: rider._id,
      status: 'INSIDE',
    });

    if (activeSession) {
      return Response.json(
        { error: 'Vehicle already inside', entry_time: activeSession.entry_time },
        { status: 400 }
      );
    }

    const session = new ParkingSession({
      rider_id: rider._id,
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
    console.error('Plate entry error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
