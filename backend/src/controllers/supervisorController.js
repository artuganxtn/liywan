import * as supervisorService from '../services/supervisorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFileUrl } from '../utils/urlHelper.js';

// @desc    Get all supervisors
// @route   GET /api/supervisors
// @access  Private (Admin)
export const getSupervisors = asyncHandler(async (req, res) => {
  const result = await supervisorService.getAllSupervisors(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Get single supervisor
// @route   GET /api/supervisors/:id
// @access  Private (Admin)
export const getSupervisor = asyncHandler(async (req, res) => {
  const supervisor = await supervisorService.getSupervisorById(req.params.id);
  res.json({
    success: true,
    data: supervisor,
  });
});

// @desc    Create supervisor
// @route   POST /api/supervisors
// @access  Private (Admin)
export const createSupervisor = asyncHandler(async (req, res) => {
  const supervisor = await supervisorService.createSupervisor(req.body);
  res.status(201).json({
    success: true,
    data: supervisor,
  });
});

// @desc    Update supervisor
// @route   PUT /api/supervisors/:id
// @access  Private (Admin)
export const updateSupervisor = asyncHandler(async (req, res) => {
  const supervisor = await supervisorService.updateSupervisor(req.params.id, req.body);
  res.json({
    success: true,
    data: supervisor,
  });
});

// @desc    Delete supervisor
// @route   DELETE /api/supervisors/:id
// @access  Private (Admin)
export const deleteSupervisor = asyncHandler(async (req, res) => {
  await supervisorService.deleteSupervisor(req.params.id);
  res.json({
    success: true,
    data: {},
  });
});

// @desc    Upload profile image
// @route   POST /api/supervisors/:id/avatar
// @access  Private (Admin)
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
  
  // Update supervisor profile with new image URL
  const supervisor = await supervisorService.updateSupervisor(req.params.id, { imageUrl: fullUrl });
  
  res.json({
    success: true,
    data: {
      imageUrl: fullUrl,
      supervisor,
    },
  });
});

