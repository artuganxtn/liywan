import { asyncHandler } from '../utils/asyncHandler.js';
import * as smartAssignmentService from '../services/smartAssignmentService.js';

// @desc    Get smart staff matches for event role
// @route   GET /api/events/:id/smart-match/:role
// @access  Private (Admin)
export const getSmartMatches = asyncHandler(async (req, res) => {
  const { id: eventId, role } = req.params;
  const { count = 5 } = req.query;

  const matches = await smartAssignmentService.findBestStaffMatches(
    eventId,
    role,
    parseInt(count)
  );

  res.json({
    success: true,
    data: matches,
    count: matches.length,
  });
});

// @desc    Auto-assign staff to event
// @route   POST /api/events/:id/auto-assign
// @access  Private (Admin)
export const autoAssignStaff = asyncHandler(async (req, res) => {
  const { id: eventId } = req.params;
  const { autoCreateShifts = false, notifyStaff = true, maxAssignmentsPerRole = null } = req.body;

  // Get Socket.IO instance for notifications
  const io = req.app.get('io') || null;
  if (io) {
    global.io = io;
  }

  try {
    const result = await smartAssignmentService.autoAssignStaffToEvent(eventId, {
      autoCreateShifts,
      notifyStaff,
      maxAssignmentsPerRole: maxAssignmentsPerRole ? parseInt(maxAssignmentsPerRole) : null,
    });

    res.json({
      success: true,
      message: `Successfully auto-assigned ${result.assigned} staff members`,
      data: result,
    });
  } finally {
    if (global.io) {
      delete global.io;
    }
  }
});

// @desc    Auto-create shifts for event
// @route   POST /api/events/:id/auto-shifts
// @access  Private (Admin)
export const autoCreateShifts = asyncHandler(async (req, res) => {
  const { id: eventId } = req.params;
  const { staffIds = null, notifyStaff = true } = req.body;

  // Get Socket.IO instance for notifications
  const io = req.app.get('io') || null;
  if (io) {
    global.io = io;
  }

  try {
    const result = await smartAssignmentService.autoCreateShiftsForEvent(
      eventId,
      staffIds
    );

    res.json({
      success: true,
      message: `Successfully created ${result.created} shifts`,
      data: result,
    });
  } finally {
    if (global.io) {
      delete global.io;
    }
  }
});

// @desc    Detect scheduling conflicts
// @route   POST /api/shifts/detect-conflicts
// @access  Private (Admin)
export const detectConflicts = asyncHandler(async (req, res) => {
  const { staffId, startTime, endTime, excludeShiftId = null } = req.body;

  if (!staffId || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: 'staffId, startTime, and endTime are required',
    });
  }

  const conflicts = await smartAssignmentService.detectConflicts(
    staffId,
    startTime,
    endTime,
    excludeShiftId
  );

  res.json({
    success: true,
    data: conflicts,
    hasConflicts: conflicts.length > 0,
  });
});

// @desc    Get smart recommendations for event
// @route   GET /api/events/:id/recommendations
// @access  Private (Admin)
export const getRecommendations = asyncHandler(async (req, res) => {
  const { id: eventId } = req.params;

  const recommendations = await smartAssignmentService.getEventRecommendations(eventId);

  res.json({
    success: true,
    data: recommendations,
  });
});

