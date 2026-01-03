import AuditLog from '../models/AuditLog.js';

export const getAllLogs = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.user) {
    filter.user = { $regex: query.user, $options: 'i' };
  }
  if (query.action) {
    filter.action = { $regex: query.action, $options: 'i' };
  }
  if (query.resourceType) {
    filter.resourceType = query.resourceType;
  }
  if (query.startDate && query.endDate) {
    filter.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await AuditLog.countDocuments(filter);

  // Format logs data
  const formattedLogs = (logs || []).map((log) => {
    const logObj = JSON.parse(JSON.stringify(log));
    
    if (logObj._id) {
      logObj._id = logObj._id.toString();
    }
    
    // Format timestamp
    if (logObj.createdAt) {
      logObj.timestamp = new Date(logObj.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return logObj;
  });

  return {
    data: formattedLogs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const createLog = async (logData) => {
  const log = await AuditLog.create({
    user: logData.user,
    role: logData.role,
    action: logData.action,
    details: logData.details,
    resourceType: logData.resourceType || 'System',
    resourceId: logData.resourceId,
    ipAddress: logData.ipAddress,
    userAgent: logData.userAgent,
  });

  const formattedLog = JSON.parse(JSON.stringify(log));
  if (formattedLog._id) {
    formattedLog._id = formattedLog._id.toString();
  }
  
  return formattedLog;
};

