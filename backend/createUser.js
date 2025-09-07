const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createUser = async (userData) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bill_management');
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { registrationNumber: userData.registrationNumber }]
    });

    if (existingUser) {
      console.log(`User with email ${userData.email} or registration number ${userData.registrationNumber} already exists`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      registrationNumber: userData.registrationNumber,
      profileInfo: {
        phone: userData.phone || '',
        department: userData.department || '',
        position: userData.position || ''
      },
      isActive: true
    });

    await user.save();
    console.log(`✅ Created ${userData.role} user: ${userData.name} (${userData.email})`);

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log(`
Usage: node createUser.js <name> <email> <password> <role> [registrationNumber] [phone] [department] [position]

Examples:
  node createUser.js "John Admin" "john@admin.com" "admin123" "admin" "ADMIN002"
  node createUser.js "Jane Manager" "jane@manager.com" "manager123" "operations_manager" "MGR002"
  node createUser.js "Bob User" "bob@user.com" "user123" "user" "USR002"

Roles: admin, operations_manager, user
  `);
  process.exit(1);
}

const [name, email, password, role, registrationNumber, phone, department, position] = args;

// Validate role
const validRoles = ['admin', 'operations_manager', 'user'];
if (!validRoles.includes(role)) {
  console.error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
  process.exit(1);
}

// Generate registration number if not provided
const regNumber = registrationNumber || `${role.toUpperCase().substring(0, 3)}${Date.now().toString().slice(-3)}`;

const userData = {
  name,
  email,
  password,
  role,
  registrationNumber: regNumber,
  phone: phone || '',
  department: department || '',
  position: position || ''
};

createUser(userData);
