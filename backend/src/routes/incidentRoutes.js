import express from 'express';
import {
  getIncidents,
  createIncident,
  resolveIncident,
} from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getIncidents)
  .post(protect, createIncident);

router.put('/:id/resolve', protect, authorize('ADMIN', 'SUPERVISOR'), resolveIncident);

export default router;

