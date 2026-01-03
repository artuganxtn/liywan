import * as applicationService from '../services/applicationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper to get Socket.IO instance from app
const getIO = (req) => {
  return req.app.get('io');
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private (Admin)
export const getApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getAllApplications(req.query);
  
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Get current staff member's applications
// @route   GET /api/applications/me
// @access  Private (Staff - own applications)
export const getMyApplications = asyncHandler(async (req, res) => {
  // Get staff profile from authenticated user
  const StaffProfile = (await import('../models/StaffProfile.js')).default;
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id });
  
  if (!staffProfile) {
    // If no staff profile, try filtering by email
    const result = await applicationService.getAllApplications({ 
      ...req.query,
      email: req.user.email 
    });
    
    return res.json({
      success: true,
      ...result,
    });
  }
  
  // Filter by staffId
  const result = await applicationService.getAllApplications({ 
    ...req.query,
    staffId: staffProfile._id.toString() 
  });
  
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Admin)
export const getApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id);
  res.json({
    success: true,
    data: application,
  });
});

// @desc    Create application
// @route   POST /api/applications
// @access  Public
export const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(req.body);
  
  // Include user account info in response if account was created
  const responseData = {
    ...application.toObject(),
  };
  
  // Check if user account was created (user exists now)
  const User = (await import('../models/User.js')).default;
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    responseData.accountCreated = true;
    responseData.loginEmail = user.email;
  }
  
  res.status(201).json({
    success: true,
    data: responseData,
    message: 'Application submitted successfully! Your account has been created. Please check your email for login credentials.',
  });
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Admin)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, ...interviewData } = req.body;
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    status,
    interviewData
  );
  
  // Emit real-time update via Socket.IO
  const io = getIO(req);
  if (io && application.staffId) {
    io.to(`user:${application.staffId}`).emit('applicationUpdate', {
      id: application._id?.toString() || application.id,
      staffId: application.staffId,
      staffName: application.staffName,
      eventName: application.eventName,
      status: application.status,
    });
  }
  
  res.json({
    success: true,
    data: application,
  });
});

