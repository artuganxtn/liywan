import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getBookings)
  .post(createBooking); // Public

router.route('/:id')
  .get(protect, authorize('ADMIN'), getBooking);

router.put('/:id/status', protect, authorize('ADMIN'), updateBookingStatus);

export default router;

