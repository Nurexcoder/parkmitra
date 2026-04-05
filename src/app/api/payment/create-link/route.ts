import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import razorpay from '@/lib/razorpay';

// POST /api/payment/create-link
// Creates a Razorpay payment link for the rider to pay on their phone
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { session_id, amount, vehicle_number } = body;

    if (!session_id || !amount || !vehicle_number) {
      return Response.json(
        { error: 'session_id, amount, and vehicle_number are required' },
        { status: 400 }
      );
    }

    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      description: `Parking fee — ${vehicle_number}`,
      reference_id: session_id,
      expire_by: Math.floor(Date.now() / 1000) + 1800, // 30 min expiry (Razorpay min is 15 min)
      options: {
        checkout: {
          method: {
            upi: '1',
            card: '1',
            netbanking: '1',
            wallet: '1',
          },
        },
      },
    });

    return Response.json({
      success: true,
      link_id: paymentLink.id,
      payment_url: paymentLink.short_url,
    });
  } catch (error) {
    console.error('Payment link creation error:', error);
    return Response.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
});
