const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const Report = require('../models/Report');
const { auth, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');
const { generateId } = require('../utils/generateId');

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
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, images, and text files are allowed.'));
    }
  }
});

// Upload file to report
router.post('/upload/:reportId', auth, requireRole(['operations_manager']), upload.single('file'), auditMiddleware('upload_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const file = new File({
      fileId: generateId('file'),
      reportId: report._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: `/uploads/${req.file.filename}`,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    });

    await file.save();

    const populatedFile = await File.findById(file._id)
      .populate('uploadedBy', 'name email')
      .populate('reportId', 'title reportId');

    res.status(201).json({
      message: 'File uploaded successfully',
      file: populatedFile
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Get files for a report
router.get('/report/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const files = await File.find({ reportId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Error fetching files' });
  }
});

// Download file
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId)
      .populate('reportId')
      .populate('uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to this file
    if (req.user.role === 'user' && !file.reportId.assignedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
});

// Delete file
router.delete('/:fileId', auth, requireRole(['operations_manager', 'admin']), auditMiddleware('delete_file'), async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// Get file info
router.get('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId)
      .populate('reportId', 'title reportId')
      .populate('uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to this file
    if (req.user.role === 'user' && !file.reportId.assignedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file info:', error);
    res.status(500).json({ message: 'Error fetching file info' });
  }
});

module.exports = router;
