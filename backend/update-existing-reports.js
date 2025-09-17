const mongoose = require('mongoose');
const Report = require('./models/Report');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ebill-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateExistingReports() {
  try {
    console.log('Starting to update existing reports...');
    
    // Find all existing reports
    const reports = await Report.find({});
    console.log(`Found ${reports.length} reports to update`);
    
    for (const report of reports) {
      const updateData = {};
      
      // Add missing fields with default values
      if (!report.amount) {
        updateData.amount = 0;
      }
      
      if (!report.dueDate) {
        updateData.dueDate = null;
      }
      
      if (!report.category) {
        updateData.category = 'other';
      }
      
      if (!report.files) {
        updateData.files = [];
      }
      
      if (!report.paymentInfo) {
        updateData.paymentInfo = {
          paymentMethod: null,
          paymentDate: null,
          transactionId: null,
          notes: null
        };
      }
      
      // Update status enum if needed
      if (report.status && !['draft', 'pending', 'paid', 'overdue', 'cancelled'].includes(report.status)) {
        if (report.status === 'active') {
          updateData.status = 'pending';
        } else if (report.status === 'archived') {
          updateData.status = 'cancelled';
        } else {
          updateData.status = 'draft';
        }
      }
      
      // Update category enum if needed
      if (report.category && !['electricity', 'water', 'gas', 'internet', 'phone', 'rent', 'insurance', 'other'].includes(report.category)) {
        updateData.category = 'other';
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await Report.findByIdAndUpdate(report._id, updateData);
        console.log(`Updated report: ${report.title}`);
      }
    }
    
    console.log('Successfully updated all existing reports!');
  } catch (error) {
    console.error('Error updating reports:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateExistingReports();