import express from 'express';
import {
  getSupervisors,
  getSupervisor,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  uploadAvatar,
} from '../controllers/supervisorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getSupervisors)
  .post(protect, authorize('ADMIN'), createSupervisor);

router.route('/:id')
  .get(protect, authorize('ADMIN'), getSupervisor)
  .put(protect, authorize('ADMIN'), updateSupervisor)
  .delete(protect, authorize('ADMIN'), deleteSupervisor);

router.post('/:id/avatar', protect, authorize('ADMIN'), upload.single('image'), uploadAvatar);

export default router;

