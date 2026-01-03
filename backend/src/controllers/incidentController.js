import * as incidentService from '../services/incidentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
export const getIncidents = asyncHandler(async (req, res) => {
  const result = await incidentService.getAllIncidents(req.query);
  res.json({
    success: true,
    ...result,
  });
});

// @desc    Create incident
// @route   POST /api/incidents
// @access  Private
export const createIncident = asyncHandler(async (req, res) => {
  const incidentData = {
    ...req.body,
    reportedBy: req.user._id,
  };
  const incident = await incidentService.createIncident(incidentData);
  res.status(201).json({
    success: true,
    data: incident,
  });
});

// @desc    Resolve incident
// @route   PUT /api/incidents/:id/resolve
// @access  Private (Admin, Supervisor)
export const resolveIncident = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const incident = await incidentService.resolveIncident(
    req.params.id,
    req.user._id,
    resolutionNotes
  );
  res.json({
    success: true,
    data: incident,
  });
});

