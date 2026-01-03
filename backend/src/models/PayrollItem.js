import mongoose from 'mongoose';

const payrollItemSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffProfile',
    required: true,
  },
  staffName: String,
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  eventName: String,
  shiftDate: Date,
  hoursWorked: {
    type: Number,
    required: true,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Processing', 'Paid'],
    default: 'Unpaid',
  },
  overtimeHours: {
    type: Number,
    default: 0,
  },
  overtimeRate: {
    type: Number,
    default: 0,
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
  },
}, {
  timestamps: true,
});

export default mongoose.model('PayrollItem', payrollItemSchema);

