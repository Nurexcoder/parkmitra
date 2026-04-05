import { NextRequest } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import razorpay from '@/lib/razorpay';

// GET /api/payment/status/[linkId]
export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Extract linkId from URL path: /api/payment/status/<linkId>
    const linkId = request.nextUrl.pathname.split('/').pop();

    if (!linkId) {
      return Response.json({ error: 'Missing linkId' }, { status: 400 });
    }

    const paymentLink = await razorpay.paymentLink.fetch(linkId);

    return Response.json({
      success: true,
      status: paymentLink.status, // 'created' | 'paid' | 'cancelled' | 'expired'
    });
  } catch (error) {
    console.error('Payment status fetch error:', error);
    return Response.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
