import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'STAFF', 'CLIENT', 'SUPERVISOR'],
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['Event', 'Staff', 'Application', 'Payroll', 'Client', 'Supervisor', 'System'],
    default: 'System',
  },
  resourceId: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
