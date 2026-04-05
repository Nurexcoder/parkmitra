import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';

const OCR_STATUS_URL = process.env.OCR_STATUS_URL!;

// GET /api/ocr/status/:jobId
// Proxies to Modal Dict — returns current job status to the polling frontend.
export const GET = withAuth(async (
  _request: NextRequest,
  _admin: unknown,
  context: { params: Promise<{ jobId: string }> }
) => {
  try {
    const { jobId } = await context.params;

    const res = await fetch(`${OCR_STATUS_URL}?job_id=${encodeURIComponent(jobId)}`);

    if (!res.ok) {
      return Response.json({ status: 'failed', error: 'Status check failed' }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('OCR status error:', error);
    return Response.json({ status: 'failed', error: 'Internal server error' }, { status: 500 });
  }
});
