import * as payrollService from '../services/payrollService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper to get Socket.IO instance from app
const getIO = (req) => {
  return req.app.get('io');
};

// @desc    Get all payroll
// @route   GET /api/payroll
// @access  Private (Admin)
export const getPayroll = asyncHandler(async (req, res) => {
  const result = await payrollService.getAllPayroll(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Create payroll from shift
// @route   POST /api/payroll/from-shift/:shiftId
// @access  Private (Admin)
export const createPayrollFromShift = asyncHandler(async (req, res) => {
  const payroll = await payrollService.createPayrollFromShift(req.params.shiftId);
  res.status(201).json({
    success: true,
    data: payroll,
  });
});

// @desc    Update payroll status
// @route   PUT /api/payroll/:id/status
// @access  Private (Admin)
export const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const payroll = await payrollService.updatePayrollStatus(req.params.id, status);
  
  // Emit real-time update via Socket.IO
  const io = getIO(req);
  if (io && payroll.staffId) {
    io.to(`user:${payroll.staffId}`).emit('paymentUpdate', {
      id: payroll._id?.toString() || payroll.id,
      staffId: payroll.staffId,
      staffName: payroll.staffName,
      status: payroll.status,
      totalAmount: payroll.totalAmount,
      eventName: payroll.eventName,
    });
  }
  
  res.json({
    success: true,
    data: payroll,
  });
});

// @desc    Generate payroll from event
// @route   POST /api/payroll/generate-from-event/:eventId
// @access  Private (Admin)
export const generatePayrollFromEvent = asyncHandler(async (req, res) => {
  const result = await payrollService.generatePayrollFromEvent(req.params.eventId);
  res.json({
    success: true,
    data: result,
    message: `Generated ${result.length} payroll items from completed shifts`,
  });
});

// @desc    Generate payroll from all completed shifts
// @route   POST /api/payroll/generate-all
// @access  Private (Admin)
export const generatePayrollFromAll = asyncHandler(async (req, res) => {
  const result = await payrollService.generatePayrollFromAllCompletedShifts();
  res.json({
    success: true,
    data: result.created,
    message: `Generated ${result.created.length} payroll items. ${result.skipped} shifts already had payroll.`,
    stats: {
      created: result.created.length,
      skipped: result.skipped,
    },
  });
});

// @desc    Get current staff member's earnings
// @route   GET /api/payroll/me
// @access  Private (Staff - own earnings)
export const getMyEarnings = asyncHandler(async (req, res) => {
  // Get staff profile from authenticated user
  const StaffProfile = (await import('../models/StaffProfile.js')).default;
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id });
  
  if (!staffProfile) {
    return res.status(404).json({
      success: false,
      error: 'Staff profile not found',
    });
  }
  
  const result = await payrollService.getAllPayroll({ 
    ...req.query,
    staffId: staffProfile._id.toString() 
  });
  
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Create payroll item manually
// @route   POST /api/payroll
// @access  Private (Admin)
export const createPayroll = asyncHandler(async (req, res) => {
  const payroll = await payrollService.createPayrollItem(req.body);
  res.status(201).json({
    success: true,
    data: payroll,
  });
});

