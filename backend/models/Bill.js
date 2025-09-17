const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date
  },
  category: {
    type: String,
    enum: ['electricity', 'water', 'gas', 'internet', 'phone', 'rent', 'insurance', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  files: [{
    fileName: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  paymentInfo: {
    paymentMethod: String,
    paymentDate: Date,
    transactionId: String,
    notes: String
  },
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
billSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate billId before validation
billSchema.pre('validate', function(next) {
  if (!this.billId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    this.billId = `bill_${timestamp}_${random}`;
  }
  next();
});

// Index for better query performance
billSchema.index({ createdBy: 1, createdAt: -1 });
billSchema.index({ category: 1 });
billSchema.index({ status: 1 });
billSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Bill', billSchema);
