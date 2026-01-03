import * as clientService from '../services/clientService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFileUrl } from '../utils/urlHelper.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private (Admin)
export const getClients = asyncHandler(async (req, res) => {
  const result = await clientService.getAllClients(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private (Admin)
export const getClient = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id);
  res.json({
    success: true,
    data: client,
  });
});

// @desc    Create client
// @route   POST /api/clients
// @access  Private (Admin)
export const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.body);
  res.status(201).json({
    success: true,
    data: client,
  });
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Admin)
export const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body);
  res.json({
    success: true,
    data: client,
  });
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Admin)
export const deleteClient = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.params.id);
  res.json({
    success: true,
    data: {},
  });
});

// @desc    Upload profile image
// @route   POST /api/clients/:id/avatar
// @access  Private (Admin)
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  const fullUrl = getFileUrl(req, req.file.filename);
  
  // Update client profile with new image URL
  const client = await clientService.updateClient(req.params.id, { imageUrl: fullUrl });
  
  res.json({
    success: true,
    data: {
      imageUrl: fullUrl,
      client,
    },
  });
});

