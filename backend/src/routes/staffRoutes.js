import express from 'express';
import {
  getStaff,
  getMyProfile,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  uploadDocument,
  verifyDocument,
  uploadAvatar,
  addGalleryPhoto,
  deleteGalleryPhoto,
  updateGalleryPhoto,
} from '../controllers/staffController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.route('/')
  .get(getStaff) // No security
  .post(createStaff); // No security

router.get('/me', protect, getMyProfile); // Protected - requires authentication

router.route('/:id')
  .get(getStaffMember) // No security
  .put(updateStaff) // No security
  .delete(deleteStaff); // No security

router.post('/:id/documents', upload.single('file'), uploadDocument); // No security
router.put('/:id/documents/:docId', verifyDocument); // No security
router.post('/:id/avatar', upload.single('image'), uploadAvatar); // No security
router.post('/:id/gallery', protect, addGalleryPhoto); // Protected
router.delete('/:id/gallery/:photoId', protect, deleteGalleryPhoto); // Protected
router.put('/:id/gallery/:photoId', protect, updateGalleryPhoto); // Protected

export default router;

