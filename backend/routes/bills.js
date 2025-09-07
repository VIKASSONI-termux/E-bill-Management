const express = require('express');
const Bill = require('../models/Bill');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

// Get all bills for the current user
router.get('/my-bills', auth, requireRole(['user']), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query - include bills created by user OR assigned to user
    const query = {
      $or: [
        { createdBy: req.user._id },
        { assignedUsers: req.user._id }
      ]
    };
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$and = [
        {
          $or: [
            { createdBy: req.user._id },
            { assignedUsers: req.user._id }
          ]
        },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      ];
      delete query.$or; // Remove the original $or since we're using $and now
    }
    
    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bill.countDocuments(query);
    
    res.json({
      bills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user bills:', error);
    res.status(500).json({ message: 'Error fetching bills' });
  }
});

// Create a new bill
router.post('/', auth, requireRole(['user', 'operations_manager', 'admin']), async (req, res) => {
  try {
    const billData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // If no assignedUsers specified, assign to creator
    if (!billData.assignedUsers || billData.assignedUsers.length === 0) {
      billData.assignedUsers = [req.user._id];
    }
    
    const bill = new Bill(billData);
    await bill.save();
    
    await bill.populate('createdBy', 'name email');
    await bill.populate('assignedUsers', 'name email');
    
    res.status(201).json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill' });
  }
});

// Upload files to a bill
router.post('/:billId/files', auth, requireRole(['user']), upload.array('files', 5), async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has access to this bill (created by user OR assigned to user)
    const hasAccess = bill.createdBy.toString() === req.user._id.toString() || 
                     bill.assignedUsers.some(userId => userId.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Add file information to bill
    const fileData = req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    }));
    
    bill.files.push(...fileData);
    await bill.save();
    
    res.json({
      message: 'Files uploaded successfully',
      files: fileData
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

// Get bill analytics for user
router.get('/analytics', auth, requireRole(['user']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all bills for the user (created by user OR assigned to user)
    const bills = await Bill.find({
      $or: [
        { createdBy: userId },
        { assignedUsers: userId }
      ]
    });
    
    // Calculate analytics
    const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const averageAmount = bills.length > 0 ? totalAmount / bills.length : 0;
    
    // Category breakdown
    const categoryBreakdown = bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + 1;
      return acc;
    }, {});
    
    // Status breakdown
    const statusBreakdown = bills.reduce((acc, bill) => {
      acc[bill.status] = (acc[bill.status] || 0) + 1;
      return acc;
    }, {});
    
    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.createdAt);
        return billDate.getMonth() === date.getMonth() && billDate.getFullYear() === date.getFullYear();
      });
      monthlyTrend.push({
        month,
        count: monthBills.length,
        amount: monthBills.reduce((sum, bill) => sum + bill.amount, 0)
      });
    }
    
    // Amount by category
    const amountByCategory = bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
      return acc;
    }, {});
    
    res.json({
      totalBills: bills.length,
      totalAmount,
      averageAmount,
      categoryBreakdown,
      statusBreakdown,
      monthlyTrend,
      amountByCategory
    });
  } catch (error) {
    console.error('Error fetching bill analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// Update bill status (mark as paid, etc.)
router.patch('/:billId/status', auth, requireRole(['user']), async (req, res) => {
  try {
    const { billId } = req.params;
    const { status, paymentInfo } = req.body;
    
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has access to this bill (created by user OR assigned to user)
    const hasAccess = bill.createdBy.toString() === req.user._id.toString() || 
                     bill.assignedUsers.some(userId => userId.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    bill.status = status;
    if (paymentInfo) {
      bill.paymentInfo = { ...bill.paymentInfo, ...paymentInfo };
    }
    
    await bill.save();
    
    res.json({
      message: 'Bill status updated successfully',
      bill
    });
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ message: 'Error updating bill status' });
  }
});

// Download bill file
router.get('/:billId/files/:fileId/download', auth, requireRole(['user']), async (req, res) => {
  try {
    const { billId, fileId } = req.params;
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has access to this bill
    if (bill.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const file = bill.files.id(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }
    
    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
});

// Delete a bill
router.delete('/:billId', auth, requireRole(['user']), async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has access to this bill (created by user OR assigned to user)
    const hasAccess = bill.createdBy.toString() === req.user._id.toString() || 
                     bill.assignedUsers.some(userId => userId.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete associated files
    for (const file of bill.files) {
      const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Bill.findByIdAndDelete(billId);
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Error deleting bill' });
  }
});

// Get a specific bill
router.get('/:billId', auth, requireRole(['user']), async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await Bill.findById(billId)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has access to this bill (created by user OR assigned to user)
    const hasAccess = bill.createdBy._id.toString() === req.user._id.toString() || 
                     bill.assignedUsers.some(userId => userId.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Error fetching bill' });
  }
});

module.exports = router;
