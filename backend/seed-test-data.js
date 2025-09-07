const mongoose = require('mongoose');
const Report = require('./models/Report');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bill_management')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedTestData() {
  try {
    console.log('\n=== Seeding Test Data ===');
    
    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    console.log('Cleared existing data');
    
    // Create test users
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      registrationNumber: 'ADM001',
      profileInfo: {
        department: 'IT',
        position: 'System Administrator'
      }
    });
    
    const managerUser = new User({
      name: 'Manager User',
      email: 'manager@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'operations_manager',
      registrationNumber: 'MGR001',
      profileInfo: {
        department: 'Operations',
        position: 'Operations Manager'
      }
    });
    
    const regularUser = new User({
      name: 'Regular User',
      email: 'user@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      registrationNumber: 'USR001',
      profileInfo: {
        department: 'Finance',
        position: 'Accountant'
      }
    });
    
    // Save users
    const savedAdmin = await adminUser.save();
    const savedManager = await managerUser.save();
    const savedRegular = await regularUser.save();
    
    console.log('Created test users');
    
    // Create test reports
    const report1 = new Report({
      reportId: 'REP001',
      title: 'Monthly Electricity Bill Report',
      description: 'Monthly report for electricity consumption and billing',
      category: 'Monthly Report',
      priority: 'medium',
      status: 'active',
      createdBy: savedManager._id,
      assignedUsers: [savedRegular._id],
      tags: ['electricity', 'monthly', 'billing']
    });
    
    const report2 = new Report({
      reportId: 'REP002',
      title: 'Special Investigation Report',
      description: 'Investigation into unusual power consumption patterns',
      category: 'Investigation',
      priority: 'high',
      status: 'draft',
      createdBy: savedManager._id,
      assignedUsers: [],
      tags: ['investigation', 'power', 'consumption']
    });
    
    const report3 = new Report({
      reportId: 'REP003',
      title: 'Annual Energy Audit Report',
      description: 'Comprehensive annual audit of energy usage',
      category: 'Annual Audit',
      priority: 'urgent',
      status: 'active',
      createdBy: savedManager._id,
      assignedUsers: [savedRegular._id, savedAdmin._id],
      tags: ['annual', 'audit', 'energy']
    });
    
    // Save reports
    await report1.save();
    await report2.save();
    await report3.save();
    
    console.log('Created test reports');
    
    // Verify data
    const users = await User.find({}).select('name email role');
    const reports = await Report.find({}).populate('createdBy', 'name email');
    
    console.log(`\nFinal count: ${users.length} users, ${reports.length} reports`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedTestData();
