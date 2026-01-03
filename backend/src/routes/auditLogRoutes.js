import express from 'express';
import {
  getLogs,
  createLog,
} from '../controllers/auditLogController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getLogs)
  .post(protect, authorize('ADMIN'), createLog);

export default router;

