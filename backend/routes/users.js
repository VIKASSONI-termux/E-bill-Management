const express = require('express');
const Report = require('../models/Report');
const { auth, requireRole } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get reports assigned to the current user
router.get('/my-reports', auth, requireRole(['user']), async (req, res) => {
  try {
    console.log('User requesting reports:', req.user._id, req.user.role);
    
    // Get reports assigned to this user OR all active reports if user is not assigned to any
    const reports = await Report.find({
      $or: [
        { assignedUsers: req.user._id },
        { assignedUsers: { $size: 0 } } // Reports with no assigned users
      ],
      status: { $ne: 'deleted' }
    }).populate('createdBy', 'name email')
      .populate('assignedUsers', 'name registrationNumber')
      .sort({ createdAt: -1 });

    console.log('Found reports:', reports.length);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Get reports by registration number (for users to search)
router.get('/search/:registrationNumber', async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    
    // Find user by registration number
    const User = require('../models/User');
    const user = await User.findOne({ registrationNumber });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get reports assigned to this user
    const reports = await Report.find({
      $or: [
        { assignedUsers: user._id },
        { assignedUsers: { $size: 0 } } // Reports with no assigned users
      ],
      status: { $ne: 'deleted' }
    }).populate('createdBy', 'name email')
      .populate('assignedUsers', 'name registrationNumber')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error searching reports:', error);
    res.status(500).json({ message: 'Error searching reports' });
  }
});

// Download a specific report
router.get('/download/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has access to this report
    if (req.user.role === 'user' && !report.assignedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', report.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, report.originalName);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Error downloading report' });
  }
});

// Export reports as CSV/Excel (for users)
router.get('/export/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has access to this report
    if (req.user.role === 'user' && !report.assignedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    // For now, return report data as JSON
    // In a real implementation, you would convert this to CSV/Excel
    res.json({
      report: report,
      exportFormat: 'json' // This would be CSV or Excel in real implementation
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Error exporting report' });
  }
});

module.exports = router;
