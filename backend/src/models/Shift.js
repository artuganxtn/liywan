import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  eventTitle: String,
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffProfile',
    required: true,
  },
  location: String,
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Completed', 'Pending'],
    default: 'Scheduled',
  },
  confirmationStatus: {
    type: String,
    enum: ['Confirmed', 'Declined', 'Pending'],
    default: 'Pending',
  },
  wage: {
    type: Number,
    required: true,
  },
  instructions: String,
  contactPerson: String,
  contactPhone: String,
  attire: String,
  attendanceStatus: {
    type: String,
    enum: ['On Time', 'En Route', 'Running Late', 'Arrived', 'Absent'],
  },
  checkInTime: Date,
  checkOutTime: Date,
  role: String,
  uniformVerified: {
    type: Boolean,
    default: false,
  },
  hoursWorked: Number,
  overtimeHours: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Shift', shiftSchema);

