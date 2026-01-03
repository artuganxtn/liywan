import express from 'express';
import {
  getPayroll,
  getMyEarnings,
  createPayroll,
  createPayrollFromShift,
  updatePayrollStatus,
  generatePayrollFromEvent,
  generatePayrollFromAll,
} from '../controllers/payrollController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Staff can view their own earnings
router.get('/me', protect, getMyEarnings);

router.route('/')
  .get(protect, authorize('ADMIN'), getPayroll)
  .post(protect, authorize('ADMIN'), createPayroll);

router.post('/from-shift/:shiftId', protect, authorize('ADMIN'), createPayrollFromShift);
router.post('/generate-from-event/:eventId', protect, authorize('ADMIN'), generatePayrollFromEvent);
router.post('/generate-all', protect, authorize('ADMIN'), generatePayrollFromAll);
router.put('/:id/status', protect, authorize('ADMIN'), updatePayrollStatus);

export default router;

