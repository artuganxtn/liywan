import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import StaffProfile from '../models/StaffProfile.js';
import ClientProfile from '../models/ClientProfile.js';
import SupervisorProfile from '../models/SupervisorProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, ...profileData } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'STAFF',
  });

  // Create profile based on role
  if (role === 'STAFF') {
    await StaffProfile.create({
      userId: user._id,
      name,
      email,
      ...profileData,
    });
  } else if (role === 'CLIENT') {
    await ClientProfile.create({
      userId: user._id,
      contactPerson: name,
      email,
      ...profileData,
    });
  } else if (role === 'SUPERVISOR') {
    await SupervisorProfile.create({
      userId: user._id,
      name,
      email,
      ...profileData,
    });
  }

  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Set cookies for session persistence
  res.cookie('auth_token', token, {
    httpOnly: false, // Set to true in production with HTTPS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: false, // Set to true in production with HTTPS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password',
    });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Account is deactivated',
    });
  }

  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Set cookies for session persistence
  res.cookie('auth_token', token, {
    httpOnly: false, // Set to true in production with HTTPS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: false, // Set to true in production with HTTPS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not found in request',
    });
  }

  let profile = null;

  try {
    if (req.user.role === 'STAFF') {
      profile = await StaffProfile.findOne({ userId: req.user._id });
    } else if (req.user.role === 'CLIENT') {
      profile = await ClientProfile.findOne({ userId: req.user._id });
    } else if (req.user.role === 'SUPERVISOR') {
      profile = await SupervisorProfile.findOne({ userId: req.user._id });
    }
  } catch (profileError) {
    // Log error but don't fail the request - profile is optional
    console.error('Error fetching user profile:', profileError);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
      },
      profile,
    },
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token required',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    const newToken = user.getSignedJwtToken();
    const newRefreshToken = user.getRefreshToken();

    // Update cookies
    res.cookie('auth_token', newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
});

// @desc    Forgot password - Send reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required',
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists for security
    return res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Save hashed token and expiry (10 minutes)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // Send email with reset link
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  // Log token in development for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Password Reset Token (Development Only):', resetToken);
    console.log('📧 Reset URL:', resetUrl);
  }

  try {
    const { sendEmail } = await import('../utils/emailService.js');
    await sendEmail(user.email, 'Password Reset Request', 'password_reset', {
      name: user.name,
      resetUrl: resetUrl,
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined, // Include token in email for dev
    });
  } catch (emailError) {
    console.error('Email sending error:', emailError);
    // Don't fail the request if email fails
    // In production, you might want to queue the email for retry
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.',
    // Only return token in development for testing
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters',
    });
  }

  // Hash the token to compare with stored token
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token',
    });
  }

  // Set new password (will be hashed by pre-save hook)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  // Save user - pre-save hook will hash the password
  await user.save();

  // Send confirmation email
  try {
    const { sendEmail } = await import('../utils/emailService.js');
    await sendEmail(user.email, 'Password Changed Successfully', 'password_changed', {
      name: user.name,
    });
  } catch (emailError) {
    console.error('Email sending error:', emailError);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Password reset successful',
  });
});

// @desc    Change password (for authenticated users)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters',
    });
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect',
    });
  }

  user.password = newPassword;
  await user.save();

  // Send confirmation email
  try {
    const { sendEmail } = await import('../utils/emailService.js');
    await sendEmail(user.email, 'Password Changed Successfully', 'password_changed', {
      name: user.name,
    });
  } catch (emailError) {
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});
