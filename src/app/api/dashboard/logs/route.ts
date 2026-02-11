import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// GET /api/dashboard/logs - Get recent parking sessions
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const sessions = await ParkingSession.find()
      .populate('rider_id')
      .sort({ created_at: -1 })
      .limit(limit);

    const formattedSessions = sessions.map((session) => {
      const rider = session.rider_id as any;
      return {
        id: session._id,
        vehicle_number: rider?.vehicle_number || 'N/A',
        rider_name: rider?.name || 'N/A',
        entry_time: session.entry_time,
        exit_time: session.exit_time,
        duration_minutes: session.duration_minutes,
        amount: session.amount,
        status: session.status,
        payment_status: session.payment_status,
      };
    });

    return Response.json({
      success: true,
      logs: formattedSessions,
    });
  } catch (error) {
    console.error('Dashboard logs error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
