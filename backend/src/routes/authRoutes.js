import express from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to authentication endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.get('/me', protect, getMe);
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('refresh_token');
  res.json({ success: true, message: 'Logged out successfully' });
});
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.put('/reset-password/:resetToken', passwordResetLimiter, resetPassword);
router.put('/change-password', protect, changePassword);

export default router;
