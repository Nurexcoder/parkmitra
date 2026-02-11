import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count vehicles currently inside
    const vehiclesInside = await ParkingSession.countDocuments({
      status: 'INSIDE',
    });

    // Count total vehicles today
    const totalToday = await ParkingSession.countDocuments({
      created_at: { $gte: today, $lt: tomorrow },
    });

    // Calculate total revenue today
    const revenueResult = await ParkingSession.aggregate([
      {
        $match: {
          created_at: { $gte: today, $lt: tomorrow },
          payment_status: 'PAID',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const revenueToday = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return Response.json({
      success: true,
      stats: {
        vehicles_inside: vehiclesInside,
        total_today: totalToday,
        revenue_today: revenueToday,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
