import express from 'express';
import {
  staffingForecast,
  adminAssistant,
  matchStaff,
} from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/staffing-forecast', protect, authorize('ADMIN'), staffingForecast);
router.post('/admin-assistant', protect, authorize('ADMIN'), adminAssistant);
router.post('/match-staff', protect, authorize('ADMIN'), matchStaff);

export default router;

