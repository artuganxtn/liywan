import * as staffService from '../services/staffService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFileUrl } from '../utils/urlHelper.js';

// @desc    Get current staff member's profile
// @route   GET /api/staff/me
// @access  Private (Requires authentication)
export const getMyProfile = asyncHandler(async (req, res) => {
  // Get userId from authenticated user (from protect middleware)
  const userId = req.user?._id || req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required. Please ensure you are authenticated.',
    });
  }
  const staff = await staffService.getStaffByUserId(userId);
  if (!staff) {
    return res.status(404).json({
      success: false,
      error: 'Staff profile not found',
    });
  }
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
export const getStaff = asyncHandler(async (req, res) => {
  const result = await staffService.getAllStaff(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Get single staff
// @route   GET /api/staff/:id
// @access  Private
export const getStaffMember = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaffById(req.params.id);
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Create staff
// @route   POST /api/staff
// @access  Private (Admin)
export const createStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body);
  res.status(201).json({
    success: true,
    data: staff,
  });
});

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private (Admin, Staff - own profile)
export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(req.params.id, req.body);
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
export const deleteStaff = asyncHandler(async (req, res) => {
  await staffService.deleteStaff(req.params.id);
  res.json({
    success: true,
    data: {},
  });
});

// @desc    Upload document
// @route   POST /api/staff/:id/documents
// @access  Private (Admin, Staff - own profile)
export const uploadDocument = asyncHandler(async (req, res) => {
  const documentData = {
    title: req.body.title,
    type: req.body.type,
    url: req.file ? `/uploads/${req.file.filename}` : req.body.url,
    expiryDate: req.body.expiryDate,
  };

  const staff = await staffService.uploadStaffDocument(req.params.id, documentData);
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Verify document
// @route   PUT /api/staff/:id/documents/:docId
// @access  Private (Admin)
export const verifyDocument = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required',
    });
  }
  
  const validStatuses = ['Verified', 'Pending', 'Expired', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }
  
  const staff = await staffService.verifyDocument(req.params.id, req.params.docId, status);
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Upload profile image
// @route   POST /api/staff/:id/avatar
// @access  Private (Admin, Staff - own profile)
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  const fullUrl = getFileUrl(req, req.file.filename);
  
  // Update staff profile with new image URL
  const staff = await staffService.updateStaff(req.params.id, { imageUrl: fullUrl });
  
  res.json({
    success: true,
    data: {
      imageUrl: fullUrl,
      staff,
    },
  });
});

// @desc    Add gallery photo
// @route   POST /api/staff/:id/gallery
// @access  Private (Admin, Staff - own profile)
export const addGalleryPhoto = asyncHandler(async (req, res) => {
  const { url, thumbnail, caption, isProfilePicture } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Photo URL is required',
    });
  }

  const photoData = {
    url: url,
    thumbnail: thumbnail || url,
    caption: caption || '',
    uploadedAt: new Date(),
    isProfilePicture: isProfilePicture === true || isProfilePicture === 'true',
  };

  const staff = await staffService.addGalleryPhoto(req.params.id, photoData);
  
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Delete gallery photo
// @route   DELETE /api/staff/:id/gallery/:photoId
// @access  Private (Admin, Staff - own profile)
export const deleteGalleryPhoto = asyncHandler(async (req, res) => {
  const staff = await staffService.deleteGalleryPhoto(req.params.id, req.params.photoId);
  
  res.json({
    success: true,
    data: staff,
  });
});

// @desc    Update gallery photo
// @route   PUT /api/staff/:id/gallery/:photoId
// @access  Private (Admin, Staff - own profile)
export const updateGalleryPhoto = asyncHandler(async (req, res) => {
  const { caption, isProfilePicture } = req.body;
  
  const updateData = {};
  if (caption !== undefined) updateData.caption = caption;
  if (isProfilePicture !== undefined) updateData.isProfilePicture = isProfilePicture === true || isProfilePicture === 'true';

  const staff = await staffService.updateGalleryPhoto(req.params.id, req.params.photoId, updateData);
  
  res.json({
    success: true,
    data: staff,
  });
});

