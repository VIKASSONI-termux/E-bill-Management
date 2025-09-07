import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './backend/models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bill_management');

async function clearTestUsers() {
  try {
    // Delete test users (keep the seeded users)
    const result = await User.deleteMany({
      email: { 
        $regex: /test|vikas|uni|soni/, 
        $options: 'i' 
      }
    });
    
    console.log(`Deleted ${result.deletedCount} test users`);
    
    // Show remaining users
    const remainingUsers = await User.find({}, 'name email registrationNumber role');
    console.log('\nRemaining users:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error clearing test users:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearTestUsers();
