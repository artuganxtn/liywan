import Shift from '../models/Shift.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all shifts
// @route   GET /api/shifts
// @access  Private
export const getShifts = asyncHandler(async (req, res) => {
  const {
    eventId,
    staffId,
    status,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  const filter = {};

  if (eventId) filter.eventId = eventId;
  if (staffId) filter.staffId = staffId;
  if (status) filter.status = status;

  // Staff can only see their own shifts
  if (req.user.role === 'STAFF') {
    const StaffProfile = (await import('../models/StaffProfile.js')).default;
    const staffProfile = await StaffProfile.findOne({ userId: req.user._id });
    if (staffProfile) {
      filter.staffId = staffProfile._id;
    } else {
      // If staff profile doesn't exist, return empty array instead of error
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }
  }

  const skip = (page - 1) * limit;

  const shifts = await Shift.find(filter)
    .populate('eventId', 'title location')
    .populate('staffId', 'name role email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Shift.countDocuments(filter);

  res.json({
    success: true,
    data: shifts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single shift
// @route   GET /api/shifts/:id
// @access  Private
export const getShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id)
    .populate('eventId', 'title location')
    .populate('staffId', 'name role email');

  if (!shift) {
    return res.status(404).json({
      success: false,
      error: 'Shift not found',
    });
  }

  res.json({
    success: true,
    data: shift,
  });
});

// @desc    Create shift
// @route   POST /api/shifts
// @access  Private (Admin)
export const createShift = asyncHandler(async (req, res) => {
  const shift = await Shift.create(req.body);
  const populatedShift = await Shift.findById(shift._id)
    .populate('eventId', 'title location startAt')
    .populate('staffId', 'name role email userId');

  // Send notification to staff member about shift assignment
  if (populatedShift.staffId && populatedShift.eventId) {
    try {
      const StaffProfile = (await import('../models/StaffProfile.js')).default;
      const staffProfile = await StaffProfile.findOne({ userId: populatedShift.staffId.userId });
      
      if (staffProfile) {
        const { notifyShiftAssignment } = await import('../utils/notificationHelper.js');
        const io = req.app.get('io') || null;
        
        await notifyShiftAssignment(
          {
            userId: populatedShift.staffId.userId,
            email: populatedShift.staffId.email,
            name: populatedShift.staffId.name || staffProfile.name,
          },
          {
            _id: populatedShift._id,
            id: populatedShift._id.toString(),
            date: populatedShift.date,
            startTime: populatedShift.startTime,
            endTime: populatedShift.endTime,
            location: populatedShift.location,
            role: populatedShift.role,
            wage: populatedShift.wage,
            instructions: populatedShift.instructions,
            eventId: populatedShift.eventId._id || populatedShift.eventId,
            eventTitle: populatedShift.eventTitle,
          },
          {
            _id: populatedShift.eventId._id || populatedShift.eventId,
            id: populatedShift.eventId._id?.toString() || populatedShift.eventId.toString(),
            title: populatedShift.eventId.title,
            location: populatedShift.eventId.location,
          },
          io
        );
      }
    } catch (notifError) {
      // Don't fail the shift creation if notification fails
    }
  }

  res.status(201).json({
    success: true,
    data: populatedShift,
  });
});

// @desc    Update shift
// @route   PUT /api/shifts/:id
// @access  Private
export const updateShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('eventId', 'title location startAt')
    .populate('staffId', 'name role email userId');

  if (!shift) {
    return res.status(404).json({
      success: false,
      error: 'Shift not found',
    });
  }

  // Send notification to staff member if shift was updated (only if significant changes)
  if (shift.staffId && shift.eventId && (req.body.startTime || req.body.endTime || req.body.date)) {
    try {
      const StaffProfile = (await import('../models/StaffProfile.js')).default;
      const staffProfile = await StaffProfile.findOne({ userId: shift.staffId.userId });
      
      if (staffProfile) {
        const { notifyShiftAssignment } = await import('../utils/notificationHelper.js');
        const io = req.app.get('io') || null;
        
        await notifyShiftAssignment(
          {
            userId: shift.staffId.userId,
            email: shift.staffId.email,
            name: shift.staffId.name || staffProfile.name,
          },
          {
            _id: shift._id,
            id: shift._id.toString(),
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            location: shift.location,
            role: shift.role,
            wage: shift.wage,
            instructions: shift.instructions,
            eventId: shift.eventId._id || shift.eventId,
            eventTitle: shift.eventTitle,
          },
          {
            _id: shift.eventId._id || shift.eventId,
            id: shift.eventId._id?.toString() || shift.eventId.toString(),
            title: shift.eventId.title,
            location: shift.eventId.location,
          },
          io
        );
      }
    } catch (notifError) {
      // Don't fail the shift update if notification fails
    }
  }

  res.json({
    success: true,
    data: shift,
  });
});

// @desc    Check in/out
// @route   POST /api/shifts/:id/checkin
// @route   POST /api/shifts/:id/checkout
// @access  Private (Staff)
export const checkIn = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) {
    return res.status(404).json({
      success: false,
      error: 'Shift not found',
    });
  }

  shift.attendanceStatus = 'Arrived';
  shift.checkInTime = new Date();
  shift.status = 'Live';
  await shift.save();

  res.json({
    success: true,
    data: shift,
  });
});

export const checkOut = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) {
    return res.status(404).json({
      success: false,
      error: 'Shift not found',
    });
  }

  shift.checkOutTime = new Date();
  shift.status = 'Completed';

  // Calculate hours worked
  if (shift.checkInTime) {
    const hours = (new Date(shift.checkOutTime) - new Date(shift.checkInTime)) / (1000 * 60 * 60);
    shift.hoursWorked = hours;
  }

  await shift.save();

  res.json({
    success: true,
    data: shift,
  });
});

