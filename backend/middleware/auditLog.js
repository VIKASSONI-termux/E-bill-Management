const AuditLog = require('../models/AuditLog');
const { generateId } = require('../utils/generateId');

const createAuditLog = async (req, action, details = {}) => {
  try {
    const auditLog = new AuditLog({
      logId: generateId('log'),
      reportId: req.body.reportId || req.params.reportId,
      fileId: req.body.fileId || req.params.fileId,
      action,
      performedBy: req.user._id,
      details: {
        ...details,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await auditLog.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

const auditMiddleware = (action, details) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Create audit log after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog(req, action, {
          ...details,
          responseStatus: res.statusCode,
          responseData: data
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
