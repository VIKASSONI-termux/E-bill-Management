const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bill_management');
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create default users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        registrationNumber: 'ADMIN001',
        profileInfo: {
          phone: '+1-555-0101',
          department: 'Administration',
          position: 'System Administrator'
        },
        isActive: true
      },
      {
        name: 'Operations Manager',
        email: 'manager@example.com',
        password: await bcrypt.hash('manager123', 10),
        role: 'operations_manager',
        registrationNumber: 'MGR001',
        profileInfo: {
          phone: '+1-555-0102',
          department: 'Operations',
          position: 'Operations Manager'
        },
        isActive: true
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        role: 'user',
        registrationNumber: 'USR001',
        profileInfo: {
          phone: '+1-555-0103',
          department: 'Finance',
          position: 'Accountant'
        },
        isActive: true
      }
    ];

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log('Created default users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\nDefault login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('User: user@example.com / user123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

seedUsers();
