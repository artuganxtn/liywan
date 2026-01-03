import * as bookingService from '../services/bookingService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin)
export const getBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getAllBookings(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (Admin)
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id);
  res.json({
    success: true,
    data: booking,
  });
});

// @desc    Create booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body);
  res.status(201).json({
    success: true,
    data: booking,
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin)
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, eventId } = req.body;
  
  // If status is "Approved", convert booking to event
  if (status === 'Approved' && !eventId) {
    const result = await bookingService.convertBookingToEvent(req.params.id);
    res.json({
      success: true,
      data: result.booking,
      event: result.event,
      message: 'Booking converted to event successfully',
    });
    return;
  }
  
  const booking = await bookingService.updateBookingStatus(req.params.id, status, eventId);
  res.json({
    success: true,
    data: booking,
  });
});

