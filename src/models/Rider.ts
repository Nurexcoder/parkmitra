import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRider extends Document {
  name: string;
  phone: string;
  email: string;
  vehicle_number: string;
  qr_code: string;
  image_key?: string;  // R2 object key of the plate photo
  created_at: Date;
}

const RiderSchema = new Schema<IRider>({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  vehicle_number: {
    type: String,
    required: false,
    uppercase: true,
    trim: true,
    default: '',
  },
  qr_code: {
    type: String,
    required: true,
    unique: true,
  },
  image_key: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster lookups
RiderSchema.index({ vehicle_number: 1 });
RiderSchema.index({ qr_code: 1 });

// Prevent model recompilation in development
const Rider: Model<IRider> = mongoose.models.Rider || mongoose.model<IRider>('Rider', RiderSchema);

export default Rider;
