import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Rider from '@/models/Rider';
import { withAuth } from '@/lib/auth';
import { generateQRCode } from '@/lib/qr';
import { sendQREmail } from '@/lib/email';

// GET /api/riders - List all riders with optional search
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = {};
    if (search) {
      query = {
        $or: [
          { vehicle_number: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const riders = await Rider.find(query)
      .sort({ created_at: -1 })
      .limit(100);

    return Response.json({
      success: true,
      riders,
    });
  } catch (error) {
    console.error('Get riders error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/riders - Create new rider
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, phone, vehicle_number, email, image_key } = body;

    // Validate required fields — vehicle_number OR image_key must be present
    if (!name || !phone || !email) {
      return Response.json(
        { error: 'Name, phone, and email are required' },
        { status: 400 }
      );
    }
    if (!vehicle_number && !image_key) {
      return Response.json(
        { error: 'Either vehicle number or a plate photo is required' },
        { status: 400 }
      );
    }

    // Check if vehicle already exists (only if vehicle_number provided)
    if (vehicle_number) {
      const existingRider = await Rider.findOne({
        vehicle_number: vehicle_number.toUpperCase()
      });
      if (existingRider) {
        return Response.json(
          { error: 'Vehicle number already registered' },
          { status: 400 }
        );
      }
    }

    // Create new rider instance (generates _id automatically)
    const rider = new Rider({
      name,
      phone,
      email,
      vehicle_number: vehicle_number ? vehicle_number.toUpperCase() : '',
      image_key: image_key || undefined,
      qr_code: 'placeholder', // Temporary placeholder
    });

    // Generate QR code with rider ID
    const qrCodeDataURL = await generateQRCode(rider._id.toString());
    
    // Set the real QR code
    rider.qr_code = qrCodeDataURL;

    // Save rider with QR code
    await rider.save();

    // Send QR code via email
    try {
      await sendQREmail(email, name, qrCodeDataURL);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    return Response.json({
      success: true,
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        vehicle_number: rider.vehicle_number,
        created_at: rider.created_at,
      },
      message: 'Rider created successfully. QR code sent to email.',
    });
  } catch (error) {
    console.error('Create rider error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
