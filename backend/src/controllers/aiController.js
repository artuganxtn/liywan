import * as aiService from '../services/aiService.js';
import Event from '../models/Event.js';
import StaffProfile from '../models/StaffProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Predict staffing needs
// @route   POST /api/ai/staffing-forecast
// @access  Private (Admin)
export const staffingForecast = asyncHandler(async (req, res) => {
  const { eventType, attendees, location } = req.body;
  const result = await aiService.predictStaffingNeeds(eventType, attendees, location);
  res.json({
    success: true,
    data: result,
  });
});

// @desc    Admin assistant
// @route   POST /api/ai/admin-assistant
// @access  Private (Admin)
export const adminAssistant = asyncHandler(async (req, res) => {
  const { query, context } = req.body;
  const result = await aiService.askAdminAssistant(query, context);
  res.json({
    success: true,
    data: { response: result },
  });
});

// @desc    Match staff to event
// @route   POST /api/ai/match-staff
// @access  Private (Admin)
export const matchStaff = asyncHandler(async (req, res) => {
  const { eventId, role } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found',
    });
  }

  const staffList = await StaffProfile.find(role ? { role } : {});
  const result = await aiService.matchStaffToEvent(event, staffList, role);

  res.json({
    success: true,
    data: result,
  });
});

