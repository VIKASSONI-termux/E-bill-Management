const express = require('express');
const Bill = require('../models/Bill');
const { auth, requireRole } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get all bills for the current user
router.get('/my-bills', auth, requireRole(['user']), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query - include bills created by user OR assigned to user, but only approved bills
    const query = {
      $and: [
        {
          $or: [
            { createdBy: req.user._id },
            { assignedUsers: req.user._id }
          ]
        },
        { approvalStatus: 'approved' }
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

// Create a new bill (admin and operations manager only)
router.post('/', auth, requireRole(['operations_manager', 'admin']), async (req, res) => {
  try {
    const billData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Set approval status based on creator role
    if (req.user.role === 'admin') {
      billData.approvalStatus = 'approved';
      billData.approvedBy = req.user._id;
      billData.approvedAt = new Date();
    } else {
      // Operations manager creates bills that need admin approval
      billData.approvalStatus = 'pending';
    }
    
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

// Get pending bills for admin approval
router.get('/pending-approval', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const bills = await Bill.find({ approvalStatus: 'pending' })
      .populate('createdBy', 'name email role')
      .populate('assignedUsers', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bill.countDocuments({ approvalStatus: 'pending' });
    
    res.json({
      bills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending bills:', error);
    res.status(500).json({ message: 'Error fetching pending bills' });
  }
});

// Approve a bill (admin only)
router.put('/:billId/approve', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { billId } = req.params;
    const { rejectionReason } = req.body;
    
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    if (bill.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Bill is not pending approval' });
    }
    
    bill.approvalStatus = 'approved';
    bill.approvedBy = req.user._id;
    bill.approvedAt = new Date();
    
    await bill.save();
    
    await bill.populate('createdBy', 'name email');
    await bill.populate('assignedUsers', 'name email');
    await bill.populate('approvedBy', 'name email');
    
    res.json({
      message: 'Bill approved successfully',
      bill
    });
  } catch (error) {
    console.error('Error approving bill:', error);
    res.status(500).json({ message: 'Error approving bill' });
  }
});

// Reject a bill (admin only)
router.put('/:billId/reject', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { billId } = req.params;
    const { rejectionReason } = req.body;
    
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    if (bill.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Bill is not pending approval' });
    }
    
    bill.approvalStatus = 'rejected';
    bill.approvedBy = req.user._id;
    bill.approvedAt = new Date();
    bill.rejectionReason = rejectionReason;
    
    await bill.save();
    
    await bill.populate('createdBy', 'name email');
    await bill.populate('assignedUsers', 'name email');
    await bill.populate('approvedBy', 'name email');
    
    res.json({
      message: 'Bill rejected successfully',
      bill
    });
  } catch (error) {
    console.error('Error rejecting bill:', error);
    res.status(500).json({ message: 'Error rejecting bill' });
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
