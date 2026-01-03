import express from 'express';
import { upload, getFileUrl } from '../utils/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFileUrl as getFullFileUrl } from '../utils/urlHelper.js';

const router = express.Router();

// @desc    Upload single file
// @route   POST /api/upload
// @access  Public (for applications)
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const fileUrl = getFileUrl(req.file.filename);
  const fullUrl = getFullFileUrl(req, req.file.filename);

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fullUrl,
      path: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
}));

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Public (for applications)
router.post('/multiple', upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const files = req.files.map(file => {
    const fileUrl = getFileUrl(file.filename);
    const fullUrl = getFullFileUrl(req, file.filename);
    return {
      filename: file.filename,
      originalName: file.originalname,
      url: fullUrl,
      path: fileUrl,
      size: file.size,
      mimetype: file.mimetype
    };
  });

  res.json({
    success: true,
    data: files
  });
}));

export default router;

