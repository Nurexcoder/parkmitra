const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Admin Schema (duplicated for standalone script)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password_hash: String,
  created_at: { type: Date, default: Date.now },
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@parkmitra.com' });
    
    if (existingAdmin) {
      console.log('⚠ Admin already exists. Skipping seed.');
      await mongoose.connection.close();
      return;
    }

    // Create default admin
    const password = 'admin123';
    const password_hash = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name: 'Admin',
      email: 'admin@parkmitra.com',
      password_hash,
    });

    await admin.save();

    console.log('✓ Admin created successfully!');
    console.log('');
    console.log('=================================');
    console.log('Default Admin Credentials:');
    console.log('Email: admin@parkmitra.com');
    console.log('Password: admin123');
    console.log('=================================');
    console.log('');
    console.log('⚠ IMPORTANT: Change the password after first login!');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
