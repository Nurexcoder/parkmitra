import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import ParkingSession from '@/models/ParkingSession';
import { withAuth } from '@/lib/auth';

// POST /api/exit/confirm - Confirm payment and complete exit
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { session_id, amount, duration_minutes, payment_method = 'cash', razorpay_payment_link_id } = body;

    if (!session_id || !amount || !duration_minutes) {
      return Response.json(
        { error: 'Session ID, amount, and duration are required' },
        { status: 400 }
      );
    }

    // Find and update session
    const session = await ParkingSession.findById(session_id);

    if (!session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'EXITED') {
      return Response.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Update session with exit details
    session.exit_time = new Date();
    session.duration_minutes = duration_minutes;
    session.amount = amount;
    session.status = 'EXITED';
    session.payment_status = 'PAID';
    session.payment_method = payment_method;
    if (razorpay_payment_link_id) session.razorpay_payment_link_id = razorpay_payment_link_id;

    await session.save();

    return Response.json({
      success: true,
      message: 'Payment confirmed. Exit recorded successfully.',
      session: {
        id: session._id,
        entry_time: session.entry_time,
        exit_time: session.exit_time,
        duration_minutes: session.duration_minutes,
        amount: session.amount,
      },
    });
  } catch (error) {
    console.error('Exit confirmation error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
