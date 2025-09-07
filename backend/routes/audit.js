const express = require('express');
const AuditLog = require('../models/AuditLog');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get audit logs with pagination
router.get('/', auth, requireRole(['admin', 'operations_manager']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Filter by report if provided
    if (req.query.reportId) {
      filter.reportId = req.query.reportId;
    }
    
    // Filter by action if provided
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // Filter by user if provided
    if (req.query.userId) {
      filter.performedBy = req.query.userId;
    }
    
    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .populate('reportId', 'title reportId')
      .populate('fileId', 'originalName fileId')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// Get audit log by ID
router.get('/:logId', auth, requireRole(['admin', 'operations_manager']), async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findById(logId)
      .populate('performedBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .populate('reportId', 'title reportId')
      .populate('fileId', 'originalName fileId');

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ message: 'Error fetching audit log' });
  }
});

// Get audit statistics
router.get('/stats/overview', auth, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const userStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$performedBy',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          userRole: '$user.role',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const recentActivity = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .populate('reportId', 'title reportId')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      actionStats: stats,
      userStats,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Error fetching audit statistics' });
  }
});

// Export audit logs
router.get('/export/csv', auth, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .populate('reportId', 'title reportId')
      .populate('fileId', 'originalName fileId')
      .sort({ timestamp: -1 });

    // Convert to CSV format
    const csvHeader = 'Timestamp,Action,Performed By,Verified By,Report,File,IP Address,User Agent\n';
    const csvData = logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const action = log.action;
      const performedBy = log.performedBy ? `${log.performedBy.name} (${log.performedBy.email})` : '';
      const verifiedBy = log.verifiedBy ? `${log.verifiedBy.name} (${log.verifiedBy.email})` : '';
      const report = log.reportId ? log.reportId.title : '';
      const file = log.fileId ? log.fileId.originalName : '';
      const ipAddress = log.ipAddress || '';
      const userAgent = log.userAgent || '';
      
      return `${timestamp},"${action}","${performedBy}","${verifiedBy}","${report}","${file}","${ipAddress}","${userAgent}"`;
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ message: 'Error exporting audit logs' });
  }
});

module.exports = router;
