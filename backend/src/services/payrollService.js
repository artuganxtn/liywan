import PayrollItem from '../models/PayrollItem.js';
import Shift from '../models/Shift.js';
import Event from '../models/Event.js';
import StaffProfile from '../models/StaffProfile.js';

// Note: Service functions don't use asyncHandler - only route handlers do

export const getAllPayroll = async (query = {}) => {
  const {
    status,
    staffId,
    eventId,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (staffId) {
    filter.staffId = staffId;
  }

  if (eventId) {
    filter.eventId = eventId;
  }

  const skip = (page - 1) * limit;

  const payroll = await PayrollItem.find(filter)
    .populate('staffId', 'name email role imageUrl')
    .populate('eventId', 'title location startAt endAt description status')
    .populate('shiftId', 'startTime endTime role location')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PayrollItem.countDocuments(filter);

  return {
    data: payroll,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPayrollById = async (id) => {
  const payroll = await PayrollItem.findById(id)
    .populate('staffId', 'name email role imageUrl')
    .populate('eventId', 'title location startAt endAt description status')
    .populate('shiftId', 'startTime endTime role location');
  if (!payroll) {
    throw new Error('Payroll item not found');
  }
  return payroll;
};

export const createPayrollFromShift = async (shiftId) => {
  const shift = await Shift.findById(shiftId)
    .populate('staffId', 'name email')
    .populate('eventId', 'title');

  if (!shift) {
    throw new Error('Shift not found');
  }

  // Calculate hours worked
  const hoursWorked = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
  const hourlyRate = shift.wage / hoursWorked || 150; // Default rate

  const payroll = await PayrollItem.create({
    staffId: shift.staffId._id,
    staffName: shift.staffId.name,
    eventId: shift.eventId._id,
    eventName: shift.eventId.title,
    shiftDate: shift.date,
    hoursWorked: hoursWorked,
    hourlyRate: hourlyRate,
    totalAmount: shift.wage,
    overtimeHours: shift.overtimeHours || 0,
    overtimeRate: hourlyRate * 1.5,
    shiftId: shift._id,
    status: 'Unpaid',
  });

  return await PayrollItem.findById(payroll._id)
    .populate('staffId', 'name email')
    .populate('eventId', 'title');
};

// Create payroll item manually
export const createPayrollItem = async (payrollData) => {
  const payroll = await PayrollItem.create(payrollData);
  return await PayrollItem.findById(payroll._id)
    .populate('staffId', 'name email')
    .populate('eventId', 'title');
};

// Generate payroll from completed shifts for an event
export const generatePayrollFromEvent = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // Find all completed shifts for this event
  const completedShifts = await Shift.find({
    eventId: eventId,
    status: 'Completed',
  }).populate('staffId', 'name email');

  const payrollItems = [];

  for (const shift of completedShifts) {
    // Check if payroll already exists for this shift
    const existingPayroll = await PayrollItem.findOne({ shiftId: shift._id });
    if (existingPayroll) {
      continue; // Skip if already generated
    }

    // Calculate hours worked
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
    
    // Calculate hourly rate from wage
    const hourlyRate = shift.wage && hoursWorked > 0 ? shift.wage / hoursWorked : 150; // Default QAR 150/hour
    
    // Calculate overtime (hours over 8)
    const regularHours = Math.min(hoursWorked, 8);
    const overtimeHours = Math.max(0, hoursWorked - 8);
    const overtimeRate = hourlyRate * 1.5;
    
    // Calculate total amount
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const totalAmount = regularPay + overtimePay;

    const payrollItem = await PayrollItem.create({
      staffId: shift.staffId._id,
      staffName: shift.staffId.name,
      eventId: event._id,
      eventName: event.title,
      shiftDate: shift.date,
      hoursWorked: hoursWorked,
      hourlyRate: hourlyRate,
      totalAmount: totalAmount,
      overtimeHours: overtimeHours,
      overtimeRate: overtimeRate,
      shiftId: shift._id,
      status: 'Unpaid',
    });

    payrollItems.push(payrollItem);
  }

  return payrollItems;
};

// Generate payroll from all completed shifts (bulk)
export const generatePayrollFromAllCompletedShifts = async () => {
  const completedShifts = await Shift.find({
    status: 'Completed',
  }).populate('staffId', 'name email').populate('eventId', 'title');

  const payrollItems = [];
  const skipped = [];

  for (const shift of completedShifts) {
    // Check if payroll already exists
    const existingPayroll = await PayrollItem.findOne({ shiftId: shift._id });
    if (existingPayroll) {
      skipped.push(shift._id);
      continue;
    }

    // Calculate hours worked
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
    
    // Calculate hourly rate
    const hourlyRate = shift.wage && hoursWorked > 0 ? shift.wage / hoursWorked : 150;
    
    // Calculate overtime
    const regularHours = Math.min(hoursWorked, 8);
    const overtimeHours = Math.max(0, hoursWorked - 8);
    const overtimeRate = hourlyRate * 1.5;
    
    // Calculate total
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const totalAmount = regularPay + overtimePay;

    const payrollItem = await PayrollItem.create({
      staffId: shift.staffId._id,
      staffName: shift.staffId.name,
      eventId: shift.eventId._id,
      eventName: shift.eventId.title,
      shiftDate: shift.date,
      hoursWorked: hoursWorked,
      hourlyRate: hourlyRate,
      totalAmount: totalAmount,
      overtimeHours: overtimeHours,
      overtimeRate: overtimeRate,
      shiftId: shift._id,
      status: 'Unpaid',
    });

    payrollItems.push(payrollItem);
  }

  return { created: payrollItems, skipped: skipped.length };
};

export const updatePayrollStatus = async (id, status) => {
  const payroll = await PayrollItem.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  )
    .populate('staffId', 'name email')
    .populate('eventId', 'title');

  if (!payroll) {
    throw new Error('Payroll item not found');
  }

  return payroll;
};

