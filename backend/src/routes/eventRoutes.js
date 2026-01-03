import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  assignStaff,
  updateAssignment,
} from '../controllers/eventController.js';
import {
  getSmartMatches,
  autoAssignStaff,
  autoCreateShifts,
  getRecommendations,
} from '../controllers/smartAssignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to check database connection (remove in production)
router.get('/test', async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const mongoose = (await import('mongoose')).default;
    
    // Get database info
    const dbName = Event.db?.databaseName;
    const collectionName = Event.collection.name;
    
    // Try Mongoose query
    const total = await Event.countDocuments({});
    const sample = await Event.findOne({}).lean();
    
    // Try direct MongoDB query
    let directCount = 0;
    let directSample = null;
    const possibleCollections = ['events', 'Events', 'event', 'Event'];
    
    for (const collName of possibleCollections) {
      try {
        const count = await mongoose.connection.db.collection(collName).countDocuments({});
        if (count > 0) {
          directCount = count;
          directSample = await mongoose.connection.db.collection(collName).findOne({});
          break;
        }
      } catch (e) {
        // Collection error - continue
      }
    }
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      modelQuery: {
        total,
        sample: sample ? { 
          id: sample._id?.toString(), 
          title: sample.title,
          status: sample.status,
          startAt: sample.startAt,
        } : null,
      },
      directQuery: {
        total: directCount,
        sample: directSample ? { 
          id: directSample._id?.toString(), 
          title: directSample.title,
          status: directSample.status,
        } : null,
      },
      dbInfo: {
        databaseName: dbName,
        collectionName: collectionName,
        modelName: Event.modelName,
        allCollections: collections.map(c => c.name),
      },
      message: total > 0 || directCount > 0 ? 'Events found in database' : 'No events found in database',
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.route('/:id')
  .get(protect, getEvent)
  .put(protect, authorize('ADMIN'), updateEvent)
  .delete(protect, authorize('ADMIN'), deleteEvent);

router.post('/:id/assign', protect, authorize('ADMIN'), assignStaff);
router.put('/:id/assignments/:staffId', protect, updateAssignment);

// Smart Assignment Routes
router.get('/:id/smart-match/:role', protect, authorize('ADMIN'), getSmartMatches);
router.post('/:id/auto-assign', protect, authorize('ADMIN'), autoAssignStaff);
router.post('/:id/auto-shifts', protect, authorize('ADMIN'), autoCreateShifts);
router.get('/:id/recommendations', protect, authorize('ADMIN'), getRecommendations);

export default router;

