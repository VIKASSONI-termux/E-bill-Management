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
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('File type rejected:', file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, Word, Excel, text files, and images are allowed.`));
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

    // Build filter - exclude reports marked for deletion
    const filter = { 
      'metadata.deletionRequested': { $ne: 'true' }
    };
    
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

// Get pending reports for admin approval
router.get('/pending-approval', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const reports = await Report.find({ approvalStatus: 'pending', status: { $ne: 'deleted' } })
      .populate('createdBy', 'name email role')
      .populate('assignedUsers', 'name registrationNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments({ approvalStatus: 'pending', status: { $ne: 'deleted' } });
    
    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    res.status(500).json({ message: 'Error fetching pending reports' });
  }
});

// Get pending deletion requests for admin approval
router.get('/pending-deletion', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const reports = await Report.find({ 
      'metadata.deletionRequested': 'true', 
      approvalStatus: 'pending' 
    })
      .populate('createdBy', 'name email role')
      .populate('assignedUsers', 'name registrationNumber')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments({ 
      'metadata.deletionRequested': 'true', 
      approvalStatus: 'pending' 
    });
    
    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending deletion requests:', error);
    res.status(500).json({ message: 'Error fetching pending deletion requests' });
  }
});

// Get approved reports for the current user
router.get('/my-reports', auth, requireRole(['user']), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query - include reports assigned to user, but only approved reports and not marked for deletion
    const query = {
      $and: [
        {
          $or: [
            { createdBy: req.user._id },
            { assignedUsers: req.user._id }
          ]
        },
        { approvalStatus: 'approved' },
        { 'metadata.deletionRequested': { $ne: 'true' } }
      ]
    };
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }
    
    const reports = await Report.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(query);
    
    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
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
router.post('/', auth, requireRole(['operations_manager', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, priority, assignedUsers, tags, amount, dueDate } = req.body;
    
    // Handle assignedUsers - it might be an array or JSON string
    let assignedUsersArray = [];
    if (assignedUsers) {
      if (typeof assignedUsers === 'string') {
        try {
          assignedUsersArray = JSON.parse(assignedUsers);
        } catch (e) {
          // If it's not valid JSON, treat as comma-separated string
          assignedUsersArray = assignedUsers.split(',').map(id => id.trim()).filter(id => id);
        }
      } else if (Array.isArray(assignedUsers)) {
        assignedUsersArray = assignedUsers;
      }
    }
    
    // Handle tags - it might be an array or JSON string
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          tagsArray = JSON.parse(tags);
        } catch (e) {
          // If it's not valid JSON, treat as comma-separated string
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }
    
    const reportData = {
      title,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      assignedUsers: assignedUsersArray,
      createdBy: req.user._id,
      tags: tagsArray,
      amount: amount ? parseFloat(amount) : 0,
      dueDate: dueDate ? new Date(dueDate) : null
    };
    
    // Set approval status based on creator role
    if (req.user.role === 'admin') {
      reportData.approvalStatus = 'approved';
      reportData.approvedBy = req.user._id;
      reportData.approvedAt = new Date();
    } else {
      // Operations manager creates reports that need admin approval
      reportData.approvalStatus = 'pending';
    }
    
    // If no assignedUsers specified, assign to creator
    if (!reportData.assignedUsers || reportData.assignedUsers.length === 0) {
      reportData.assignedUsers = [req.user._id];
    }
    
    // Handle file upload if present
    if (req.file) {
      console.log('File uploaded:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      reportData.files = [{
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }];
    } else {
      console.log('No file uploaded');
      reportData.files = [];
    }

    const report = new Report(reportData);
    await report.save();

    await report.populate('createdBy', 'name email');
    await report.populate('assignedUsers', 'name email');

    res.status(201).json({
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error creating report',
      error: error.message 
    });
  }
});

// Approve a report (admin only)
router.put('/:reportId/approve', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (report.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Report is not pending approval' });
    }
    
    report.approvalStatus = 'approved';
    report.approvedBy = req.user._id;
    report.approvedAt = new Date();
    
    await report.save();
    
    await report.populate('createdBy', 'name email');
    await report.populate('assignedUsers', 'name registrationNumber');
    await report.populate('approvedBy', 'name email');
    
    res.json({
      message: 'Report approved successfully',
      report
    });
  } catch (error) {
    console.error('Error approving report:', error);
    res.status(500).json({ message: 'Error approving report' });
  }
});

// Reject a report (admin only)
router.put('/:reportId/reject', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { rejectionReason } = req.body;
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (report.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Report is not pending approval' });
    }
    
    report.approvalStatus = 'rejected';
    report.approvedBy = req.user._id;
    report.approvedAt = new Date();
    report.rejectionReason = rejectionReason;
    
    await report.save();
    
    await report.populate('createdBy', 'name email');
    await report.populate('assignedUsers', 'name registrationNumber');
    await report.populate('approvedBy', 'name email');
    
    res.json({
      message: 'Report rejected successfully',
      report
    });
  } catch (error) {
    console.error('Error rejecting report:', error);
    res.status(500).json({ message: 'Error rejecting report' });
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

// Download report file
router.get('/:reportId/files/:fileId/download', auth, requireRole(['user', 'operations_manager', 'admin']), async (req, res) => {
  try {
    const { reportId, fileId } = req.params;
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has access to this report
    const hasAccess = req.user.role === 'admin' || 
                     req.user.role === 'operations_manager' ||
                     report.createdBy.toString() === req.user._id.toString() || 
                     report.assignedUsers.some(userId => userId.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Handle both ObjectId and array index
    let file;
    if (isNaN(fileId)) {
      // If fileId is not a number, treat it as ObjectId
      file = report.files.id(fileId);
    } else {
      // If fileId is a number, treat it as array index
      const index = parseInt(fileId);
      file = report.files[index];
    }
    
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

// Request report deletion (operations manager)
router.delete('/:id', auth, requireRole(['operations_manager']), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user created this report
    if (report.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark for deletion instead of actually deleting
    // We'll use a custom field to track deletion requests since 'deleted' is not in the status enum
    report.metadata = report.metadata || new Map();
    report.metadata.set('deletionRequested', 'true');
    report.metadata.set('deletionRequestedAt', new Date().toISOString());
    report.approvalStatus = 'pending'; // Require admin approval for deletion
    await report.save();

    res.json({ message: 'Report deletion requested. Awaiting admin approval.' });
  } catch (error) {
    console.error('Error requesting report deletion:', error);
    res.status(500).json({ message: 'Error requesting report deletion' });
  }
});

// Approve report deletion (admin only)
router.put('/:id/approve-deletion', auth, requireRole(['admin']), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (report.metadata?.get('deletionRequested') !== 'true') {
      return res.status(400).json({ message: 'Report is not marked for deletion' });
    }
    
    // Delete associated files
    for (const file of report.files) {
      const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Report.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error approving report deletion:', error);
    res.status(500).json({ message: 'Error approving report deletion' });
  }
});

// Reject report deletion (admin only)
router.put('/:id/reject-deletion', auth, requireRole(['admin']), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (report.metadata?.get('deletionRequested') !== 'true') {
      return res.status(400).json({ message: 'Report is not marked for deletion' });
    }
    
    // Restore report status
    report.metadata.delete('deletionRequested');
    report.metadata.delete('deletionRequestedAt');
    report.approvalStatus = 'approved';
    await report.save();
    
    res.json({ message: 'Report deletion rejected. Report restored.' });
  } catch (error) {
    console.error('Error rejecting report deletion:', error);
    res.status(500).json({ message: 'Error rejecting report deletion' });
  }
});

// Get users for assignment
router.get('/users/assignable', auth, requireRole(['operations_manager', 'admin']), async (req, res) => {
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

// Update report (operations manager and admin)
router.put('/:id', auth, requireRole(['operations_manager', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, amount, dueDate, assignedUsers, tags } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can edit this report (creator or admin)
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit reports you created' });
    }

    // Handle assignedUsers - it might be an array or JSON string
    let assignedUsersArray = [];
    if (assignedUsers) {
      if (typeof assignedUsers === 'string') {
        try {
          assignedUsersArray = JSON.parse(assignedUsers);
        } catch (e) {
          // If it's not valid JSON, treat as comma-separated string
          assignedUsersArray = assignedUsers.split(',').map(id => id.trim()).filter(id => id);
        }
      } else if (Array.isArray(assignedUsers)) {
        assignedUsersArray = assignedUsers;
      }
    }
    
    // Handle tags - it might be an array or JSON string
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          tagsArray = JSON.parse(tags);
        } catch (e) {
          // If it's not valid JSON, treat as comma-separated string
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }

    // Handle file upload if present
    if (req.file) {
      console.log('File uploaded during update:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      // Add new file to existing files array
      const newFile = {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };
      
      // Get existing files and add new one
      const existingFiles = report.files || [];
      existingFiles.push(newFile);
      
      // Update the report with new files array
      report.files = existingFiles;
      await report.save();
    }

    // Update report fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedUsers !== undefined) updateData.assignedUsers = assignedUsersArray;
    if (tags !== undefined) updateData.tags = tagsArray;

    // Add metadata for edit tracking
    updateData.metadata = {
      ...report.metadata,
      lastEditedBy: req.user._id,
      lastEditedAt: new Date()
    };

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email registrationNumber')
     .populate('assignedUsers', 'name email registrationNumber');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
});

module.exports = router;
