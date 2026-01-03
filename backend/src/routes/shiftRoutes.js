import express from 'express';
import {
  getShifts,
  getShift,
  createShift,
  updateShift,
  checkIn,
  checkOut,
} from '../controllers/shiftController.js';
import {
  detectConflicts,
} from '../controllers/smartAssignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getShifts)
  .post(protect, authorize('ADMIN'), createShift);

router.route('/:id')
  .get(protect, getShift)
  .put(protect, updateShift);

router.post('/:id/checkin', protect, authorize('STAFF'), checkIn);
router.post('/:id/checkout', protect, authorize('STAFF'), checkOut);

// Smart Features
router.post('/detect-conflicts', protect, authorize('ADMIN'), detectConflicts);

export default router;

