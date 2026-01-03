import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  eventType: String,
  date: Date,
  time: String,
  duration: String,
  location: String,
  budget: String,
  staff: {
    servers: { type: Number, default: 0 },
    hosts: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  contact: {
    name: String,
    company: String,
    phone: String,
    email: String,
  },
  eventDetails: {
    venue: String,
    guests: String,
    dressCode: String,
    special: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Converted'],
    default: 'Pending',
  },
  submittedDate: {
    type: Date,
    default: Date.now,
  },
  convertedToEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
}, {
  timestamps: true,
});

export default mongoose.model('Booking', bookingSchema);

