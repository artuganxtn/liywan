import Event from '../models/Event.js';
import StaffProfile from '../models/StaffProfile.js';
import Shift from '../models/Shift.js';

/**
 * AI-Powered Smart Staff Matching
 * Matches staff to events based on multiple factors:
 * - Role requirements
 * - Skills and certifications
 * - Availability
 * - Location proximity
 * - Performance ratings
 * - Past experience with similar events
 */
export const findBestStaffMatches = async (eventId, roleName, count = 1) => {
  try {
    const event = await Event.findById(eventId)
      .populate('clientId', 'companyName')
      .populate('supervisorId', 'name');

    if (!event) {
      throw new Error('Event not found');
    }

    // Get all available staff matching the role
    const allStaff = await StaffProfile.find({
      role: roleName,
      status: { $in: ['Available', 'On Shift'] },
    }).populate('userId', 'email');

    if (allStaff.length === 0) {
      return [];
    }

    // Calculate match scores for each staff member
    const scoredStaff = await Promise.all(
      allStaff.map(async (staff) => {
        let score = 0;
        const factors = {
          availability: 0,
          location: 0,
          performance: 0,
          experience: 0,
          skills: 0,
          certifications: 0,
        };

        // 1. Availability Score (30 points)
        // Check if staff has conflicting shifts
        const eventStart = new Date(event.startAt);
        const eventEnd = new Date(event.endAt);
        
        const conflictingShifts = await Shift.countDocuments({
          staffId: staff._id,
          $or: [
            {
              startTime: { $lt: eventEnd },
              endTime: { $gt: eventStart },
            },
          ],
          status: { $in: ['Scheduled', 'Live'] },
        });

        if (conflictingShifts === 0) {
          factors.availability = 30;
          score += 30;
        } else {
          factors.availability = Math.max(0, 30 - (conflictingShifts * 10));
          score += factors.availability;
        }

        // 2. Location Score (20 points)
        const eventLocation = typeof event.location === 'object' 
          ? event.location.city || event.location.address 
          : event.location;
        const staffLocation = staff.location || '';
        
        if (eventLocation && staffLocation) {
          // Simple location matching (can be enhanced with geolocation)
          if (eventLocation.toLowerCase().includes(staffLocation.toLowerCase()) ||
              staffLocation.toLowerCase().includes(eventLocation.toLowerCase())) {
            factors.location = 20;
            score += 20;
          } else {
            factors.location = 10; // Partial match
            score += 10;
          }
        }

        // 3. Performance Score (25 points)
        const rating = staff.rating || 0;
        factors.performance = (rating / 5) * 25; // Convert 0-5 rating to 0-25 points
        score += factors.performance;

        // 4. Experience Score (15 points)
        const completedShifts = staff.completedShifts || 0;
        if (completedShifts >= 50) {
          factors.experience = 15;
        } else if (completedShifts >= 20) {
          factors.experience = 10;
        } else if (completedShifts >= 10) {
          factors.experience = 5;
        }
        score += factors.experience;

        // 5. Skills Match (5 points)
        if (staff.skills && Array.isArray(staff.skills)) {
          const verifiedSkills = staff.skills.filter(s => s.status === 'Verified').length;
          factors.skills = Math.min(5, verifiedSkills);
          score += factors.skills;
        }

        // 6. Certifications (5 points)
        if (staff.certifications && Array.isArray(staff.certifications)) {
          const validCerts = staff.certifications.filter(c => 
            c.expiryDate ? new Date(c.expiryDate) > new Date() : true
          ).length;
          factors.certifications = Math.min(5, validCerts);
          score += factors.certifications;
        }

        // Check if already assigned to this event
        const alreadyAssigned = event.assignments?.some(
          (a) => a.staffId && a.staffId.toString() === staff._id.toString()
        );

        return {
          staff,
          score: alreadyAssigned ? 0 : score, // Exclude already assigned
          factors,
          alreadyAssigned,
        };
      })
    );

    // Sort by score (highest first) and return top matches
    return scoredStaff
      .filter(item => !item.alreadyAssigned && item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => ({
        staff: item.staff,
        score: item.score,
        factors: item.factors,
        matchPercentage: Math.round((item.score / 100) * 100),
      }));
  } catch (error) {
    throw error;
  }
};

/**
 * Auto-assign staff to event based on requirements
 * Intelligently matches and assigns staff to all required roles
 */
export const autoAssignStaffToEvent = async (eventId, options = {}) => {
  try {
    const { 
      autoCreateShifts = false,
      notifyStaff = true,
      maxAssignmentsPerRole = null,
    } = options;

    const event = await Event.findById(eventId)
      .populate('assignments.staffId', 'name role email userId');

    if (!event) {
      throw new Error('Event not found');
    }

    const requiredRoles = event.requiredRoles;
    if (!requiredRoles || (requiredRoles instanceof Map && requiredRoles.size === 0)) {
      throw new Error('Event has no required roles defined');
    }

    const assignments = [];
    const roleEntries = requiredRoles instanceof Map 
      ? Array.from(requiredRoles.entries())
      : Object.entries(requiredRoles);

    for (const [roleName, requiredCount] of roleEntries) {
      // Get current assignments for this role
      const currentAssignments = event.assignments.filter(
        (a) => a.role === roleName && a.status === 'APPROVED'
      );
      const alreadyAssigned = currentAssignments.length;
      const needed = Math.max(0, requiredCount - alreadyAssigned);

      if (needed > 0) {
        // Find best matches
        const maxToAssign = maxAssignmentsPerRole ? Math.min(needed, maxAssignmentsPerRole) : needed;
        const matches = await findBestStaffMatches(eventId, roleName, maxToAssign);

        for (const match of matches) {
          if (assignments.length >= needed) break;

          try {
            // Assign staff
            const mongoose = (await import('mongoose')).default;
            event.assignments.push({
              staffId: match.staff._id,
              role: roleName,
              status: 'APPROVED',
              assignedAt: new Date(),
            });

            assignments.push({
              staffId: match.staff._id.toString(),
              staffName: match.staff.name,
              role: roleName,
              score: match.score,
              matchPercentage: match.matchPercentage,
            });
          } catch (assignError) {
            // Error assigning staff - continue with next
          }
        }
      }
    }

    // Update staffAssigned count
    event.staffAssigned = event.assignments.filter(
      (a) => a.status === 'APPROVED'
    ).length;

    await event.save();

    // Auto-create shifts if requested
    if (autoCreateShifts && assignments.length > 0) {
      await autoCreateShiftsForEvent(eventId, assignments.map(a => a.staffId));
    }

    // Send notifications if requested
    if (notifyStaff) {
      const { notifyEventAssignment } = await import('../utils/notificationHelper.js');
      const io = global.io || null;

      for (const assignment of assignments) {
        try {
          const staff = await StaffProfile.findById(assignment.staffId).populate('userId', 'email');
          if (staff && staff.userId) {
            await notifyEventAssignment(
              {
                userId: staff.userId,
                email: staff.email,
                name: staff.name,
              },
              {
                _id: event._id,
                id: event._id.toString(),
                title: event.title,
                startAt: event.startAt,
                location: event.location,
              },
              assignment.role,
              io
            );
          }
        } catch (notifError) {
          // Error notifying staff - continue
        }
      }
    }

    return {
      success: true,
      assigned: assignments.length,
      assignments,
      event: await Event.findById(eventId).populate('assignments.staffId', 'name role email'),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Auto-generate shifts for assigned staff
 * Creates shifts based on event timeline and staff assignments
 */
export const autoCreateShiftsForEvent = async (eventId, staffIds = null) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get assigned staff (or use provided staffIds)
    let assignedStaff = [];
    if (staffIds && staffIds.length > 0) {
      assignedStaff = await StaffProfile.find({ _id: { $in: staffIds } });
    } else {
      const populatedEvent = await Event.findById(eventId)
        .populate('assignments.staffId', '_id');
      assignedStaff = populatedEvent.assignments
        .filter(a => a.status === 'APPROVED' && a.staffId)
        .map(a => a.staffId);
    }

    if (assignedStaff.length === 0) {
      return { success: true, created: 0, message: 'No assigned staff found' };
    }

    const eventStart = new Date(event.startAt);
    const eventEnd = new Date(event.endAt);
    const eventDate = eventStart.toISOString().split('T')[0];
    
    // Default shift: full event duration
    const defaultStartTime = eventStart.toISOString();
    const defaultEndTime = eventEnd.toISOString();

    const createdShifts = [];
    const location = typeof event.location === 'object' 
      ? event.location.address || event.location.city || ''
      : event.location || '';

    for (const staff of assignedStaff) {
      // Check if shift already exists
      const existingShift = await Shift.findOne({
        eventId: event._id,
        staffId: staff._id || staff,
      });

      if (existingShift) {
        continue; // Skip if shift already exists
      }

      // Get role from assignment
      const assignment = event.assignments.find(
        (a) => a.staffId && (a.staffId.toString() === (staff._id || staff).toString())
      );
      const role = assignment?.role || 'General Staff';

      // Create shift
      const shift = await Shift.create({
        eventId: event._id,
        staffId: staff._id || staff,
        eventTitle: event.title,
        location: location,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        date: eventDate,
        status: 'Scheduled',
        role: role,
        wage: 0, // Can be calculated based on role/experience
        instructions: event.description || '',
      });

      createdShifts.push(shift);
    }

    // Send notifications for created shifts
    if (createdShifts.length > 0) {
      const { notifyShiftAssignment } = await import('../utils/notificationHelper.js');
      const io = global.io || null;

      for (const shift of createdShifts) {
        try {
          const populatedShift = await Shift.findById(shift._id)
            .populate('staffId', 'name email userId')
            .populate('eventId', 'title location');

          if (populatedShift.staffId && populatedShift.staffId.userId) {
            const StaffProfile = (await import('../models/StaffProfile.js')).default;
            const staffProfile = await StaffProfile.findOne({ 
              userId: populatedShift.staffId.userId 
            });

            if (staffProfile) {
              await notifyShiftAssignment(
                {
                  userId: populatedShift.staffId.userId,
                  email: populatedShift.staffId.email,
                  name: populatedShift.staffId.name || staffProfile.name,
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
          }
        } catch (notifError) {
          // Error notifying shift creation - continue
        }
      }
    }

    return {
      success: true,
      created: createdShifts.length,
      shifts: createdShifts,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Detect and resolve scheduling conflicts
 */
export const detectConflicts = async (staffId, startTime, endTime, excludeShiftId = null) => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const query = {
      staffId,
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start },
        },
      ],
      status: { $in: ['Scheduled', 'Live'] },
    };

    if (excludeShiftId) {
      query._id = { $ne: excludeShiftId };
    }

    const conflicts = await Shift.find(query)
      .populate('eventId', 'title location startAt endAt');

    return conflicts.map(conflict => ({
      shiftId: conflict._id.toString(),
      eventTitle: conflict.eventId?.title || conflict.eventTitle,
      conflictStart: conflict.startTime,
      conflictEnd: conflict.endTime,
      overlap: calculateOverlap(start, end, conflict.startTime, conflict.endTime),
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate overlap percentage between two time ranges
 */
const calculateOverlap = (start1, end1, start2, end2) => {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
  
  if (overlapStart >= overlapEnd) {
    return 0;
  }

  const overlapDuration = overlapEnd - overlapStart;
  const range1Duration = end1 - start1;
  
  return Math.round((overlapDuration / range1Duration) * 100);
};

/**
 * Get smart recommendations for event
 */
export const getEventRecommendations = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const recommendations = {
      staffing: [],
      scheduling: [],
      budget: null,
      warnings: [],
    };

    // Staffing recommendations
    const requiredRoles = event.requiredRoles instanceof Map
      ? Array.from(event.requiredRoles.entries())
      : Object.entries(event.requiredRoles || {});

    for (const [roleName, requiredCount] of requiredRoles) {
      const currentAssignments = event.assignments.filter(
        (a) => a.role === roleName && a.status === 'APPROVED'
      ).length;
      const needed = requiredCount - currentAssignments;

      if (needed > 0) {
        const matches = await findBestStaffMatches(eventId, roleName, Math.min(needed, 5));
        recommendations.staffing.push({
          role: roleName,
          needed,
          current: currentAssignments,
          suggested: matches.map(m => ({
            staffId: m.staff._id.toString(),
            name: m.staff.name,
            matchScore: m.matchPercentage,
            factors: m.factors,
          })),
        });
      }
    }

    // Scheduling recommendations
    const eventStart = new Date(event.startAt);
    const assignedStaff = event.assignments.filter(a => a.status === 'APPROVED');
    
    if (assignedStaff.length > 0 && assignedStaff.length < event.staffRequired) {
      recommendations.scheduling.push({
        type: 'auto_create_shifts',
        message: `${assignedStaff.length} staff assigned. Auto-create shifts?`,
        action: 'auto_create_shifts',
      });
    }

    // Budget recommendations
    if (event.budget) {
      const totalAllocated = 
        (event.budget.staffingAllocated || 0) +
        (event.budget.logisticsAllocated || 0) +
        (event.budget.marketingAllocated || 0) +
        (event.budget.cateringAllocated || 0) +
        (event.budget.technologyAllocated || 0) +
        (event.budget.miscellaneousAllocated || 0);

      if (totalAllocated > event.budget.total) {
        recommendations.warnings.push({
          type: 'budget_overallocation',
          message: `Budget allocations (${totalAllocated.toLocaleString()} QAR) exceed total budget (${event.budget.total.toLocaleString()} QAR)`,
        });
      }

      recommendations.budget = {
        total: event.budget.total,
        allocated: totalAllocated,
        remaining: event.budget.total - totalAllocated,
        spent: event.budget.spent || 0,
      };
    }

    return recommendations;
  } catch (error) {
    throw error;
  }
};

