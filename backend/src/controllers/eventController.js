import * as eventService from '../services/eventService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all events
// @route   GET /api/events
// @access  Private
export const getEvents = asyncHandler(async (req, res) => {
  try {
    const result = await eventService.getAllEvents(req.query);
    
    // Ensure result is an object with data array
    if (!result || typeof result !== 'object') {
      return res.json({
        success: true,
        data: [],
        pagination: { 
          page: parseInt(req.query.page) || 1, 
          limit: parseInt(req.query.limit) || 20, 
          total: 0, 
          pages: 0 
        },
      });
    }
    
    // Ensure data is an array
    if (!Array.isArray(result.data)) {
      result.data = [];
    }
    
    const response = {
      success: true,
      data: result.data || [],
      pagination: result.pagination || { 
        page: parseInt(req.query.page) || 1, 
        limit: parseInt(req.query.limit) || 20, 
        total: 0, 
        pages: 0 
      },
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  res.json({
    success: true,
    data: event,
  });
});

// @desc    Create event
// @route   POST /api/events
// @access  Private (Admin, Client)
export const createEvent = asyncHandler(async (req, res) => {
  // If client, set clientId from user
  if (req.user.role === 'CLIENT') {
    const ClientProfile = (await import('../models/ClientProfile.js')).default;
    const clientProfile = await ClientProfile.findOne({ userId: req.user._id });
    if (clientProfile) {
      req.body.clientId = clientProfile._id;
    }
  }

  const event = await eventService.createEvent(req.body);
  res.status(201).json({
    success: true,
    data: event,
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  res.json({
    success: true,
    data: event,
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id);
  res.json({
    success: true,
    data: {},
  });
});

// @desc    Assign staff to event
// @route   POST /api/events/:id/assign
// @access  Private (Admin)
export const assignStaff = asyncHandler(async (req, res) => {
  try {
    const { staffId, role, payment } = req.body;
    
    if (!staffId || !role) {
      return res.status(400).json({
        success: false,
        error: 'Staff ID and Role are required',
      });
    }
    
    
    // Get Socket.IO instance for notifications
    const io = req.app.get('io') || null;
    
    // Pass io and payment data to service for real-time notifications
    const event = await eventService.assignStaffToEvent(req.params.id, staffId, role, io, payment);
    
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    throw error; // Let asyncHandler handle it
  }
});

// @desc    Update assignment status
// @route   PUT /api/events/:id/assignments/:staffId
// @access  Private (Admin, Client)
export const updateAssignment = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const event = await eventService.updateAssignmentStatus(
    req.params.id,
    req.params.staffId,
    status
  );
  res.json({
    success: true,
    data: event,
  });
});

