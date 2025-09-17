const mongoose = require('mongoose');
const Bill = require('./models/Bill');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bill_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateExistingBills() {
  try {
    console.log('Updating existing bills with approval status...');
    
    // Find all bills that don't have approvalStatus field
    const billsWithoutApprovalStatus = await Bill.find({
      approvalStatus: { $exists: false }
    });
    
    console.log(`Found ${billsWithoutApprovalStatus.length} bills without approval status`);
    
    // Update each bill
    for (const bill of billsWithoutApprovalStatus) {
      // Set approvalStatus based on the creator's role
      // Since we don't have the user data here, we'll set all existing bills as approved
      // This assumes existing bills were created by admins or are already approved
      bill.approvalStatus = 'approved';
      bill.approvedBy = bill.createdBy; // Set the creator as the approver
      bill.approvedAt = bill.createdAt; // Set approval time as creation time
      
      await bill.save();
      console.log(`Updated bill: ${bill.title}`);
    }
    
    console.log('✅ All existing bills updated successfully!');
    
    // Also update any bills that might have approvalStatus as null or undefined
    const billsWithNullApprovalStatus = await Bill.find({
      $or: [
        { approvalStatus: null },
        { approvalStatus: undefined }
      ]
    });
    
    console.log(`Found ${billsWithNullApprovalStatus.length} bills with null/undefined approval status`);
    
    for (const bill of billsWithNullApprovalStatus) {
      bill.approvalStatus = 'approved';
      bill.approvedBy = bill.createdBy;
      bill.approvedAt = bill.createdAt;
      
      await bill.save();
      console.log(`Updated bill with null status: ${bill.title}`);
    }
    
    console.log('✅ All bills updated successfully!');
    
  } catch (error) {
    console.error('Error updating bills:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateExistingBills();
