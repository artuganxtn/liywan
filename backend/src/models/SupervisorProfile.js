import mongoose from 'mongoose';

const supervisorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave'],
    default: 'Active',
  },
  assignedEvents: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  imageUrl: {
    type: String,
    default: 'https://i.pravatar.cc/150',
  },
  // Additional supervisor information
  location: {
    type: String,
    default: 'Doha',
  },
  department: String,
  specialization: String,
  yearsOfExperience: Number,
  certifications: [String],
  languages: [String],
  notes: String,
}, {
  timestamps: true,
});

export default mongoose.model('SupervisorProfile', supervisorProfileSchema);

