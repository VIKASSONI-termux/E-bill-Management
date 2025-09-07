const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create_report',
      'update_report',
      'delete_report',
      'upload_file',
      'update_file',
      'delete_file',
      'download_file',
      'assign_user',
      'unassign_user',
      'change_status',
      'change_priority',
      'verify_report',
      'approve_report',
      'reject_report'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Generate logId before saving
auditLogSchema.pre('save', function(next) {
  if (!this.logId) {
    this.logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Index for better query performance
auditLogSchema.index({ reportId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
