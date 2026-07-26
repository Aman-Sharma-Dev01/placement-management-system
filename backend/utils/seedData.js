const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if super_admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('⚠️  Super Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@placement.edu.in',
      password: 'admin123',
      role: 'super_admin',
    });

    console.log('✅ Super Admin created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log('   Password: admin123');
    console.log('');

    // Also create a placement_coordinator account
    const coordinator = await User.create({
      name: 'Prof. S.K. Sharma',
      email: 'coordinator@placement.edu.in',
      password: 'coord123',
      role: 'placement_coordinator',
    });

    console.log('✅ Placement Coordinator created!');
    console.log(`   Email: ${coordinator.email}`);
    console.log('   Password: coord123');
    console.log('');

    // Create placement_cell account
    const cell = await User.create({
      name: 'Placement Cell Office',
      email: 'cell@placement.edu.in',
      password: 'cell123',
      role: 'placement_cell',
    });

    console.log('✅ Placement Cell created!');
    console.log(`   Email: ${cell.email}`);
    console.log('   Password: cell123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
