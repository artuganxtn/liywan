import Incident from '../models/Incident.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllIncidents = asyncHandler(async (query = {}) => {
  const {
    status,
    type,
    severity,
    eventId,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  if (severity) {
    filter.severity = severity;
  }

  if (eventId) {
    filter.eventId = eventId;
  }

  const skip = (page - 1) * limit;

  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'name email role')
    .populate('resolvedBy', 'name email')
    .populate('eventId', 'title')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Incident.countDocuments(filter);

  return {
    data: incidents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
});

export const createIncident = asyncHandler(async (incidentData) => {
  const incident = await Incident.create(incidentData);
  return await Incident.findById(incident._id)
    .populate('reportedBy', 'name email role')
    .populate('eventId', 'title');
});

export const resolveIncident = asyncHandler(async (id, userId, resolutionNotes) => {
  const incident = await Incident.findByIdAndUpdate(
    id,
    {
      status: 'Resolved',
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolutionNotes,
    },
    { new: true, runValidators: true }
  )
    .populate('reportedBy', 'name email role')
    .populate('resolvedBy', 'name email')
    .populate('eventId', 'title');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
});

