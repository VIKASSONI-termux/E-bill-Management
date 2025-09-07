const mongoose = require('mongoose');
const Report = require('./models/Report');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bill_management')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testDatabase() {
  try {
    console.log('\n=== Database Test ===');
    
    // Check users
    const users = await User.find({}).select('name email role');
    console.log(`\nUsers found: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check reports
    const reports = await Report.find({}).populate('createdBy', 'name email');
    console.log(`\nReports found: ${reports.length}`);
    reports.forEach(report => {
      console.log(`- ${report.title} - Created by: ${report.createdBy?.name || 'Unknown'} - Status: ${report.status}`);
    });
    
    // Check specific report details
    if (reports.length > 0) {
      const firstReport = await Report.findById(reports[0]._id)
        .populate('createdBy', 'name email')
        .populate('assignedUsers', 'name registrationNumber');
      console.log('\nFirst report details:');
      console.log(JSON.stringify(firstReport, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing database:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDatabase();
