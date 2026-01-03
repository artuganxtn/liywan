import Event from '../models/Event.js';
import mongoose from 'mongoose';

export const getAllEvents = async (query = {}) => {
  try {
    // Parse query parameters - ensure they're numbers
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const sort = query.sort || '-createdAt';
    const status = query.status;
    const clientId = query.clientId;
    const search = query.search;

    // Get database connection directly
    const eventDb = Event.db;

    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }

    if (clientId) {
      filter.clientId = clientId;
    }

    // Filter for upcoming events only (if upcoming=true in query)
    if (query.upcoming === 'true' || query.upcoming === true) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.startAt = { $gte: today };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // First, let's check total count without any filters
    const totalWithoutFilter = await Event.countDocuments({});
    
    // Try to get all collections in the database
    try {
      const collections = await Event.db.listCollections().toArray();
      const eventsCollection = collections.find(c => c.name === 'events');
    } catch (err) {
      // Error listing collections - continue
    }
    
    // Try direct MongoDB native query - bypass Mongoose
    let directCount = 0;
    let directEvents = [];
    let actualCollectionName = 'events'; // Default collection name
    const db = mongoose.connection.db;
    
    // Try different collection name variations
    const possibleCollectionNames = ['events', 'Events', 'event', 'Event'];
    
    for (const collectionName of possibleCollectionNames) {
      try {
        const count = await db.collection(collectionName).countDocuments({});
        if (count > 0) {
          directCount = count;
          actualCollectionName = collectionName; // Remember which collection has events
          directEvents = await db.collection(collectionName).find({}).limit(3).toArray();
          break; // Found events, stop searching
        }
      } catch (directErr) {
        // Collection not found or error - continue
      }
    }
    
    // ALWAYS use direct query if it finds events (Mongoose might be looking in wrong place)
    if (directCount > 0) {
      
      const skip = (page - 1) * limit;
      const sortObj = sort.startsWith('-') 
        ? { [sort.substring(1)]: -1 } 
        : { [sort]: 1 };
      
      const allDirectEvents = await db.collection(actualCollectionName)
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection(actualCollectionName).countDocuments(filter);
      
      // Get StaffProfile collection for populating assignments
      const StaffProfile = (await import('../models/StaffProfile.js')).default;
      
      // Convert MongoDB documents to plain objects and populate assignments
      const eventsArray = await Promise.all(allDirectEvents.map(async (event) => {
        // Use JSON serialization to convert MongoDB types to plain objects
        const eventObj = JSON.parse(JSON.stringify(event));
        
        // Convert _id to string
        if (eventObj._id) {
          if (typeof eventObj._id.toString === 'function') {
            eventObj._id = eventObj._id.toString();
          } else if (typeof eventObj._id === 'object' && eventObj._id.$oid) {
            eventObj._id = eventObj._id.$oid;
          }
        }
        
        // Ensure requiredRoles is a plain object (Map gets converted by JSON.stringify)
        if (eventObj.requiredRoles) {
          if (eventObj.requiredRoles instanceof Map) {
            // Convert Map to plain object
            eventObj.requiredRoles = Object.fromEntries(eventObj.requiredRoles);
          } else if (typeof eventObj.requiredRoles === 'object' && !Array.isArray(eventObj.requiredRoles)) {
            // Already an object, just ensure it's a plain object
            eventObj.requiredRoles = { ...eventObj.requiredRoles };
          }
          
          // If requiredRoles is empty but staffRequired is set, create a default role
          if (Object.keys(eventObj.requiredRoles || {}).length === 0 && eventObj.staffRequired > 0) {
            eventObj.requiredRoles = {
              'General Staff': eventObj.staffRequired
            };
          }
        } else if (eventObj.staffRequired > 0) {
          // No requiredRoles but has staffRequired, create default
          eventObj.requiredRoles = {
            'General Staff': eventObj.staffRequired
          };
          console.log(`[Event ${eventObj._id}] Created default requiredRoles from staffRequired:`, eventObj.requiredRoles);
        }
        
        // Ensure location is a plain object
        if (eventObj.location && typeof eventObj.location === 'object') {
          eventObj.location = { ...eventObj.location };
        }
        
        // Ensure budget is a plain object
        if (eventObj.budget && typeof eventObj.budget === 'object') {
          eventObj.budget = { ...eventObj.budget };
        }
        
        // Ensure assignments is an array
        if (!Array.isArray(eventObj.assignments)) {
          eventObj.assignments = eventObj.assignments ? [eventObj.assignments] : [];
        }
        
        // Populate assignments.staffId manually for direct queries
        if (eventObj.assignments && eventObj.assignments.length > 0) {
          eventObj.assignments = await Promise.all(eventObj.assignments.map(async (assignment) => {
            if (assignment.staffId) {
              try {
                // Handle both ObjectId string and ObjectId object
                const staffId = assignment.staffId.toString ? assignment.staffId.toString() : assignment.staffId;
                const staffProfile = await StaffProfile.findById(staffId).lean();
                if (staffProfile) {
                  assignment.staffId = {
                    _id: staffProfile._id.toString(),
                    id: staffProfile._id.toString(),
                    name: staffProfile.name,
                    role: staffProfile.role,
                    rating: staffProfile.rating,
                    imageUrl: staffProfile.imageUrl,
                    email: staffProfile.email,
                    phone: staffProfile.phone,
                  };
                }
              } catch (populateError) {
                // Keep the original staffId if population fails
              }
            }
            return assignment;
          }));
        }
        
        return eventObj;
      }));
      
      const directResult = {
        data: eventsArray,
        pagination: {
          page: page,
          limit: limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
      
      return directResult;
    }

    const skip = (page - 1) * limit;

    // Use Mongoose query - simpler and more reliable
    let events;
    try {
      // Try with populate first
      events = await Event.find(filter)
        .populate('clientId', 'companyName contactPerson')
        .populate('supervisorId', 'name email')
        .populate('assignments.staffId', 'name role rating imageUrl')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // If no events with populate, try without populate
      if (!events || events.length === 0) {
        events = await Event.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();
      }
    } catch (populateError) {
      // Fallback to non-populated query
      events = await Event.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
    }
    
    // If still no events, try without any filters to see if events exist at all
    if (!events || events.length === 0) {
      const allEvents = await Event.find({}).limit(limit).skip(skip).sort(sort).lean();
      if (allEvents.length > 0) {
        // Use the unfiltered results if filter is too restrictive
        if (Object.keys(filter).length > 0) {
          events = allEvents;
        } else {
          // If no filter was applied but still no results, use the unfiltered query
          events = allEvents;
        }
      } else {
        // Try one more time with a completely basic query
        const basicQuery = await Event.find({}).lean();
        if (basicQuery.length > 0) {
          events = basicQuery.slice(skip, skip + limit);
        }
      }
    }

    // Ensure all events are properly formatted
    const formattedEvents = (events || []).map((event, index) => {
      try {
        // Create a new object to avoid mutating the original
        // Use a safer method that handles MongoDB types
        let eventObj;
        try {
          eventObj = JSON.parse(JSON.stringify(event));
        } catch (jsonError) {
          // Manual copy as fallback
          eventObj = {
            _id: event._id,
            title: event.title,
            description: event.description,
            location: event.location,
            startAt: event.startAt,
            endAt: event.endAt,
            status: event.status,
            requiredRoles: event.requiredRoles,
            staffRequired: event.staffRequired,
            staffAssigned: event.staffAssigned,
            revenue: event.revenue,
            budget: event.budget,
            assignments: event.assignments,
            imageUrl: event.imageUrl,
            clientId: event.clientId,
            supervisorId: event.supervisorId,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          };
        }
        
        // Convert _id to string if it's an ObjectId
        if (eventObj._id) {
          if (typeof eventObj._id.toString === 'function') {
            eventObj._id = eventObj._id.toString();
          } else if (typeof eventObj._id === 'object' && eventObj._id.$oid) {
            eventObj._id = eventObj._id.$oid;
          } else if (eventObj._id && typeof eventObj._id === 'object') {
            // Try to get string representation
            eventObj._id = String(eventObj._id);
          }
        }
      
      // Ensure requiredRoles is properly formatted (Map to object)
      // After JSON.parse(JSON.stringify), Map becomes object, but check anyway
      if (eventObj.requiredRoles) {
        if (eventObj.requiredRoles instanceof Map) {
          const rolesObj = {};
          eventObj.requiredRoles.forEach((value, key) => {
            rolesObj[key] = value;
          });
          eventObj.requiredRoles = rolesObj;
        } else if (typeof eventObj.requiredRoles === 'object' && !Array.isArray(eventObj.requiredRoles)) {
          // Already an object, ensure it's a plain object
          eventObj.requiredRoles = { ...eventObj.requiredRoles };
        }
      }
      
      // Ensure location is properly formatted
      if (eventObj.location && typeof eventObj.location === 'object') {
        eventObj.location = { ...eventObj.location };
      }
      
      // Ensure budget is properly formatted
      if (eventObj.budget && typeof eventObj.budget === 'object') {
        eventObj.budget = { ...eventObj.budget };
      }
      
      // Ensure assignments is an array
      if (!Array.isArray(eventObj.assignments)) {
        eventObj.assignments = eventObj.assignments ? [eventObj.assignments] : [];
      }
      
      return eventObj;
      } catch (transformError) {
        // Return a minimal valid event to prevent data loss
        return {
          _id: event?._id?.toString() || String(event?._id) || '',
          title: event?.title || 'Untitled Event',
          description: event?.description || '',
          location: event?.location || {},
          startAt: event?.startAt,
          endAt: event?.endAt,
          status: event?.status || 'PENDING',
          requiredRoles: event?.requiredRoles || {},
          staffRequired: event?.staffRequired || 0,
          staffAssigned: event?.staffAssigned || 0,
          revenue: event?.revenue || 0,
          budget: event?.budget || {},
          assignments: event?.assignments || [],
        };
      }
    }).filter(event => event !== null && event !== undefined); // Remove any null/undefined entries

    // Calculate total - use filter count, but if we got events without filter, use total without filter
    let total = await Event.countDocuments(filter);
    
    // If filter returns 0 but we have events without filter, use total count without filter
    if (total === 0 && formattedEvents && formattedEvents.length > 0) {
      const totalWithoutFilter = await Event.countDocuments({});
      total = totalWithoutFilter;
    }

    const result = {
      data: formattedEvents,
      pagination: {
        page: page,
        limit: limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    };
    
    return result;
  } catch (error) {
    throw error;
  }
};

export const getEventById = async (id) => {
  const event = await Event.findById(id)
    .populate('clientId', 'companyName contactPerson email phone')
    .populate('supervisorId', 'name email phone')
    .populate('assignments.staffId', 'name role rating imageUrl email phone');

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
};

export const createEvent = async (eventData) => {
  // Ensure requiredRoles is properly formatted
  if (eventData.requiredRoles && typeof eventData.requiredRoles === 'object' && !(eventData.requiredRoles instanceof Map)) {
    // Convert plain object to Map if needed (Mongoose will handle it)
    // The schema expects a Map, but we can pass an object and Mongoose will convert it
    eventData.requiredRoles = new Map(Object.entries(eventData.requiredRoles));
  }
  
  // Ensure location is properly formatted
  if (typeof eventData.location === 'string') {
    eventData.location = {
      address: eventData.location,
      city: 'Doha',
      country: 'Qatar',
    };
  }
  
  // Ensure dates are valid
  if (eventData.startAt && !(eventData.startAt instanceof Date)) {
    eventData.startAt = new Date(eventData.startAt);
  }
  if (eventData.endAt && !(eventData.endAt instanceof Date)) {
    eventData.endAt = new Date(eventData.endAt);
  }
  
  const event = await Event.create(eventData);
  return await Event.findById(event._id)
    .populate('clientId', 'companyName contactPerson')
    .populate('supervisorId', 'name email');
};

export const updateEvent = async (id, updateData) => {
  // Ensure requiredRoles is properly formatted
  if (updateData.requiredRoles && typeof updateData.requiredRoles === 'object' && !(updateData.requiredRoles instanceof Map)) {
    // Convert plain object to Map if needed
    updateData.requiredRoles = new Map(Object.entries(updateData.requiredRoles));
  }
  
  // Ensure location is properly formatted
  if (updateData.location && typeof updateData.location === 'string') {
    updateData.location = {
      address: updateData.location,
      city: 'Doha',
      country: 'Qatar',
    };
  }
  
  // Ensure dates are valid
  if (updateData.startAt && !(updateData.startAt instanceof Date)) {
    updateData.startAt = new Date(updateData.startAt);
  }
  if (updateData.endAt && !(updateData.endAt instanceof Date)) {
    updateData.endAt = new Date(updateData.endAt);
  }
  
  const event = await Event.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('clientId', 'companyName contactPerson')
    .populate('supervisorId', 'name email');

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
};

export const deleteEvent = async (id) => {
  const event = await Event.findByIdAndDelete(id);
  if (!event) {
    throw new Error('Event not found');
  }
  return event;
};

export const assignStaffToEvent = async (eventId, staffId, role, io = null, paymentData = null) => {
  try {
    // Validate inputs
    if (!eventId || !staffId || !role) {
      throw new Error('Event ID, Staff ID, and Role are required');
    }

    // Validate ObjectId format
    const mongoose = (await import('mongoose')).default;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error('Invalid Event ID format');
    }
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      throw new Error('Invalid Staff ID format');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify staff exists
    const StaffProfile = (await import('../models/StaffProfile.js')).default;
    const staff = await StaffProfile.findById(staffId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Check if staff already assigned
    const existingAssignment = event.assignments.find(
      (a) => a.staffId && a.staffId.toString() === staffId.toString()
    );

    if (existingAssignment) {
      throw new Error('Staff already assigned to this event');
    }

    // Prepare payment object if payment data is provided
    let payment = null;
    if (paymentData) {
      payment = {
        type: paymentData.type || 'hourly',
        hourlyRate: paymentData.hourlyRate || 0,
        totalHours: paymentData.totalHours || 0,
        fixedAmount: paymentData.fixedAmount || 0,
        overtimeRate: paymentData.overtimeRate || 0,
        overtimeHours: paymentData.overtimeHours || 0,
        bonus: paymentData.bonus || 0,
        deductions: paymentData.deductions || 0,
        transportationAllowance: paymentData.transportationAllowance || 0,
        mealAllowance: paymentData.mealAllowance || 0,
        totalPayment: paymentData.totalPayment || 0,
        notes: paymentData.notes || '',
      };
      
      // If totalPayment is not provided, calculate it
      if (payment.totalPayment === 0 && payment.type) {
        if (payment.type === 'hourly') {
          payment.totalPayment = (payment.hourlyRate * payment.totalHours) +
                                (payment.overtimeRate * payment.overtimeHours) +
                                payment.bonus +
                                payment.transportationAllowance +
                                payment.mealAllowance -
                                payment.deductions;
        } else if (payment.type === 'fixed') {
          payment.totalPayment = payment.fixedAmount +
                                payment.bonus +
                                payment.transportationAllowance +
                                payment.mealAllowance -
                                payment.deductions;
        } else if (payment.type === 'daily') {
          payment.totalPayment = (payment.hourlyRate * 8) + // 8 hours base
                                (payment.overtimeRate * payment.overtimeHours) +
                                payment.bonus +
                                payment.transportationAllowance +
                                payment.mealAllowance -
                                payment.deductions;
        }
      }
    }

    // Add assignment - auto-approve when assigned by admin
    const newAssignment = {
      staffId: new mongoose.Types.ObjectId(staffId),
      role: role,
      status: 'APPROVED', // Auto-approve when assigned by admin
      assignedAt: new Date(),
    };
    
    // Add payment data if provided
    if (payment) {
      newAssignment.payment = payment;
    }
    
    event.assignments.push(newAssignment);

    // Update staffAssigned count (count APPROVED assignments)
    event.staffAssigned = event.assignments.filter(
      (a) => a.status === 'APPROVED'
    ).length;

    await event.save();

    // Automatically create a shift for the assigned staff member
    try {
      const Shift = (await import('../models/Shift.js')).default;
      
      // Check if shift already exists
      const existingShift = await Shift.findOne({
        eventId: event._id,
        staffId: staff._id,
      });

      if (!existingShift) {
        // Calculate shift details from event
        const eventStart = new Date(event.startAt);
        const eventEnd = new Date(event.endAt);
        const eventDate = eventStart.toISOString().split('T')[0];
        const location = typeof event.location === 'object' 
          ? event.location.address || event.location.city || ''
          : event.location || '';

        // Calculate wage from payment data if available
        let wage = 0;
        if (payment && payment.totalPayment) {
          wage = payment.totalPayment;
        } else if (payment) {
          // Calculate wage based on payment type
          if (payment.type === 'hourly' && payment.hourlyRate && payment.totalHours) {
            wage = (payment.hourlyRate * payment.totalHours) + 
                   (payment.overtimeRate * payment.overtimeHours || 0) +
                   (payment.bonus || 0) +
                   (payment.transportationAllowance || 0) +
                   (payment.mealAllowance || 0) -
                   (payment.deductions || 0);
          } else if (payment.type === 'fixed' && payment.fixedAmount) {
            wage = payment.fixedAmount + 
                   (payment.bonus || 0) +
                   (payment.transportationAllowance || 0) +
                   (payment.mealAllowance || 0) -
                   (payment.deductions || 0);
          } else if (payment.type === 'daily' && payment.dailyRate && payment.totalDays) {
            wage = (payment.dailyRate * payment.totalDays) +
                   (payment.overtimeRate * payment.overtimeHours || 0) +
                   (payment.bonus || 0) +
                   (payment.transportationAllowance || 0) +
                   (payment.mealAllowance || 0) -
                   (payment.deductions || 0);
          }
        }

        // Create shift
        const shift = await Shift.create({
          eventId: event._id,
          staffId: staff._id,
          eventTitle: event.title,
          location: location,
          startTime: eventStart,
          endTime: eventEnd,
          date: eventDate,
          status: 'Scheduled',
          confirmationStatus: 'Confirmed', // Auto-confirm when assigned by admin
          role: role,
          wage: wage,
          instructions: event.description || payment?.notes || 'Please report 30 minutes prior for briefing.',
          contactPerson: 'Event Coordinator',
          contactPhone: '+974 4400 0000',
          attire: 'Formal Attire',
        });

        // Send shift notification
        try {
          const { notifyShiftAssignment } = await import('../utils/notificationHelper.js');
          const populatedShift = await Shift.findById(shift._id)
            .populate('staffId', 'name email userId')
            .populate('eventId', 'title location');

          if (populatedShift.staffId && populatedShift.staffId.userId) {
            await notifyShiftAssignment(
              {
                userId: populatedShift.staffId.userId,
                email: populatedShift.staffId.email,
                name: populatedShift.staffId.name || staff.name,
              },
              {
                _id: populatedShift._id,
                id: populatedShift._id.toString(),
                date: populatedShift.date,
                startTime: populatedShift.startTime,
                endTime: populatedShift.endTime,
                location: populatedShift.location,
                role: populatedShift.role,
                wage: populatedShift.wage,
                instructions: populatedShift.instructions,
                eventId: populatedShift.eventId._id,
                eventTitle: populatedShift.eventTitle,
              },
              {
                _id: populatedShift.eventId._id,
                id: populatedShift.eventId._id.toString(),
                title: populatedShift.eventId.title,
                location: populatedShift.eventId.location,
              },
              io
            );
          }
        } catch (shiftNotifError) {
          // Don't fail the assignment if notification fails
        }
      }
    } catch (shiftError) {
      // Don't fail the assignment if shift creation fails
    }

    // Return populated event
    const populatedEvent = await Event.findById(eventId)
      .populate('assignments.staffId', 'name role rating imageUrl email phone');
    
    // Send notification to staff member about event assignment
    try {
      const { notifyEventAssignment } = await import('../utils/notificationHelper.js');
      const assignedStaff = populatedEvent.assignments.find(
        (a) => a.staffId && a.staffId._id.toString() === staffId.toString()
      );
      
      if (assignedStaff && assignedStaff.staffId && staff.userId) {
        await notifyEventAssignment(
          {
            userId: staff.userId,
            email: staff.email || assignedStaff.staffId.email,
            name: staff.name || assignedStaff.staffId.name,
          },
          {
            _id: populatedEvent._id,
            id: populatedEvent._id.toString(),
            title: populatedEvent.title,
            startAt: populatedEvent.startAt,
            location: populatedEvent.location,
            assignments: populatedEvent.assignments,
          },
          role,
          io
        );
      }
    } catch (notifError) {
      // Don't fail the assignment if notification fails
    }
    
    return populatedEvent;
  } catch (error) {
    throw error;
  }
};

export const updateAssignmentStatus = async (eventId, staffId, status) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const assignment = event.assignments.find(
    (a) => a.staffId.toString() === staffId.toString()
  );

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  assignment.status = status.toUpperCase();
  event.staffAssigned = event.assignments.filter(
    (a) => a.status === 'APPROVED'
  ).length;

  await event.save();

  return await Event.findById(eventId)
    .populate('assignments.staffId', 'name role rating imageUrl');
};

