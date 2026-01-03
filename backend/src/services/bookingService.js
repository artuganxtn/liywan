import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import ClientProfile from '../models/ClientProfile.js';
import User from '../models/User.js';

// Note: Service functions don't use asyncHandler - only route handlers do

export const getAllBookings = async (query = {}) => {
  const {
    status,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const bookings = await Booking.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Booking.countDocuments(filter);

  return {
    data: bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getBookingById = async (id) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new Error('Booking not found');
  }
  return booking;
};

export const createBooking = async (bookingData) => {
  // Ensure staff object has default values if not provided
  const booking = await Booking.create({
    ...bookingData,
    staff: bookingData.staff || {
      servers: 0,
      hosts: 0,
      other: 0,
    },
  });
  return booking;
};

export const updateBookingStatus = async (id, status, eventId = null) => {
  const updateData = { status };
  if (eventId) {
    updateData.convertedToEventId = eventId;
  }

  const booking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return booking;
};

// Convert booking to event
export const convertBookingToEvent = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.convertedToEventId) {
    throw new Error('Booking already converted to event');
  }

  // Find or create client
  let client = await ClientProfile.findOne({ email: booking.contact.email });
  if (!client) {
    // First, find or create a User account
    let user = await User.findOne({ email: booking.contact.email });
    if (!user) {
      // Create a user account for the client
      user = await User.create({
        name: booking.contact.name,
        email: booking.contact.email,
        phone: booking.contact.phone,
        role: 'CLIENT',
        isActive: true,
        password: 'temp_password_' + Math.random().toString(36).slice(-8), // Temporary password
      });
    }
    
    // Create client profile with required fields
    client = await ClientProfile.create({
      userId: user._id,
      companyName: booking.contact.company || booking.contact.name + ' Events',
      contactPerson: booking.contact.name,
      email: booking.contact.email,
      phone: booking.contact.phone,
      status: 'Active',
    });
  }

  // Calculate start and end times
  const eventDate = new Date(booking.date);
  const [hours, minutes] = booking.time.split(':').map(Number);
  eventDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(eventDate);
  // Parse duration (e.g., "4 hours", "6 hours", "8 hours", "Full day")
  let durationHours = 8; // default
  if (booking.duration.includes('4')) durationHours = 4;
  else if (booking.duration.includes('6')) durationHours = 6;
  else if (booking.duration.includes('8')) durationHours = 8;
  else if (booking.duration.toLowerCase().includes('full')) durationHours = 12;
  endDate.setHours(endDate.getHours() + durationHours);

  // Convert staff requirements to requiredRoles Map
  const requiredRoles = new Map();
  if (booking.staff && booking.staff.servers > 0) requiredRoles.set('Server', booking.staff.servers);
  if (booking.staff && booking.staff.hosts > 0) requiredRoles.set('Hostess', booking.staff.hosts);
  if (booking.staff && booking.staff.other > 0) requiredRoles.set('General Staff', booking.staff.other);

  // Parse budget
  const budgetAmount = parseFloat(String(booking.budget || '0').replace(/[^0-9.]/g, '')) || 0;

  // Create event
  const event = await Event.create({
    title: `${booking.eventType} - ${booking.contact.name}`,
    description: booking.eventDetails?.special || `${booking.eventType} event at ${booking.eventDetails?.venue || booking.location}`,
    clientId: client._id,
    location: {
      address: booking.eventDetails?.venue || booking.location,
      city: booking.location.includes('Doha') ? 'Doha' : 'Doha',
      country: 'Qatar',
    },
    startAt: eventDate,
    endAt: endDate,
    status: 'APPROVED', // Approved bookings become events with Upcoming status
    requiredRoles: requiredRoles,
    revenue: budgetAmount,
    budget: {
      total: budgetAmount,
      staffingAllocated: Math.round(budgetAmount * 0.4), // 40% for staffing
      logisticsAllocated: Math.round(budgetAmount * 0.2), // 20% for logistics
      marketingAllocated: Math.round(budgetAmount * 0.15), // 15% for marketing
      cateringAllocated: Math.round(budgetAmount * 0.15), // 15% for catering
      technologyAllocated: Math.round(budgetAmount * 0.05), // 5% for technology
      miscellaneousAllocated: Math.round(budgetAmount * 0.05), // 5% for miscellaneous
    },
  });

  // Update booking status
  booking.status = 'Converted';
  booking.convertedToEventId = event._id;
  await booking.save();

  return { booking, event };
};
