import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IParkingSession extends Document {
  rider_id: Types.ObjectId;
  entry_time: Date;
  exit_time?: Date;
  duration_minutes?: number;
  amount?: number;
  status: 'INSIDE' | 'EXITED';
  payment_status: 'PENDING' | 'PAID';
  payment_method?: 'cash' | 'upi';
  razorpay_payment_link_id?: string;
  created_at: Date;
}

const ParkingSessionSchema = new Schema<IParkingSession>({
  rider_id: {
    type: Schema.Types.ObjectId,
    ref: 'Rider',
    required: true,
  },
  entry_time: {
    type: Date,
    required: true,
  },
  exit_time: {
    type: Date,
  },
  duration_minutes: {
    type: Number,
  },
  amount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['INSIDE', 'EXITED'],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['PENDING', 'PAID'],
    required: true,
  },
  payment_method: {
    type: String,
    enum: ['cash', 'upi'],
  },
  razorpay_payment_link_id: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
ParkingSessionSchema.index({ rider_id: 1, status: 1 });
ParkingSessionSchema.index({ created_at: -1 });

// Prevent model recompilation in development
const ParkingSession: Model<IParkingSession> = 
  mongoose.models.ParkingSession || mongoose.model<IParkingSession>('ParkingSession', ParkingSessionSchema);

export default ParkingSession;
