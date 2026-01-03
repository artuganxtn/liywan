import express from 'express';
import {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  getMyApplications,
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyApplications); // Staff can view their own applications

router.route('/')
  .get(protect, authorize('ADMIN'), getApplications)
  .post(createApplication); // Public

router.route('/:id')
  .get(protect, authorize('ADMIN'), getApplication);

router.put('/:id/status', protect, authorize('ADMIN'), updateApplicationStatus);

export default router;

