const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

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
    cb(null, uniqueSuffix + path.extname(file.originalname));
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
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and text files are allowed.'));
    }
  }
});

// Get all reports (for operations managers)
router.get('/', auth, requireRole(['operations_manager', 'admin']), async (req, res) => {
  try {
    console.log('Manager/Admin requesting reports');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Build filter
    const filter = { status: { $ne: 'deleted' } };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name registrationNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(filter);

    console.log('Found reports for manager:', reports.length);
    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Get a specific report
router.get('/:id', auth, requireRole(['operations_manager', 'admin']), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name registrationNumber');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

// Create new report
router.post('/', auth, requireRole(['operations_manager']), async (req, res) => {
  try {
    const { title, description, category, priority, assignedUsers, tags } = req.body;
    const { generateId } = require('../utils/generateId');

    const report = new Report({
      reportId: generateId('report'),
      title,
      description,
      category,
      priority: priority || 'medium',
      assignedUsers: assignedUsers || [],
      createdBy: req.user._id,
      tags: tags || []
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name registrationNumber');

    res.status(201).json({
      message: 'Report created successfully',
      report: populatedReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
});

// Update report
router.put('/:id', auth, requireRole(['operations_manager']), async (req, res) => {
  try {
    const { title, description, category, priority, assignedUsers, tags, status } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority) updateData.priority = priority;
    if (assignedUsers) updateData.assignedUsers = assignedUsers;
    if (tags) updateData.tags = tags;
    if (status) updateData.status = status;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('assignedUsers', 'name registrationNumber');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
});

// Delete report (soft delete)
router.delete('/:id', auth, requireRole(['operations_manager']), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report' });
  }
});

// Get users for assignment
router.get('/users/assignable', auth, requireRole(['operations_manager']), async (req, res) => {
  try {
    const users = await User.find({ 
      role: 'user', 
      isActive: true 
    }).select('name registrationNumber email');

    res.json(users);
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
