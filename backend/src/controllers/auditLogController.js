import * as auditLogService from '../services/auditLogService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all audit logs
// @route   GET /api/logs
// @access  Private (Admin)
export const getLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.getAllLogs(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Create audit log
// @route   POST /api/logs
// @access  Private (Admin)
export const createLog = asyncHandler(async (req, res) => {
  const log = await auditLogService.createLog({
    ...req.body,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });
  res.status(201).json({
    success: true,
    data: log,
  });
});

