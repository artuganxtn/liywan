import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  uploadAvatar,
} from '../controllers/clientController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getClients)
  .post(protect, authorize('ADMIN'), createClient);

router.route('/:id')
  .get(protect, authorize('ADMIN'), getClient)
  .put(protect, authorize('ADMIN'), updateClient)
  .delete(protect, authorize('ADMIN'), deleteClient);

router.post('/:id/avatar', protect, authorize('ADMIN'), upload.single('image'), uploadAvatar);

export default router;

