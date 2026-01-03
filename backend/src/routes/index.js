import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import staffRoutes from './staffRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import payrollRoutes from './payrollRoutes.js';
import incidentRoutes from './incidentRoutes.js';
import shiftRoutes from './shiftRoutes.js';
import aiRoutes from './aiRoutes.js';
import clientRoutes from './clientRoutes.js';
import supervisorRoutes from './supervisorRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = express.Router();

// Health check endpoint (under /api)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LIYWAN API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/staff', staffRoutes);
router.use('/bookings', bookingRoutes);
router.use('/applications', applicationRoutes);
router.use('/payroll', payrollRoutes);
router.use('/incidents', incidentRoutes);
router.use('/shifts', shiftRoutes);
router.use('/ai', aiRoutes);
router.use('/clients', clientRoutes);
router.use('/supervisors', supervisorRoutes);
router.use('/logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

export default router;

