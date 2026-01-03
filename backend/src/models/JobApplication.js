import mongoose from 'mongoose';

const quizAnswerSchema = new mongoose.Schema({
  questionId: Number,
  question: String,
  selectedOption: Number,
  correctOption: Number,
  isCorrect: Boolean,
});

const jobApplicationSchema = new mongoose.Schema({
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
  roleApplied: {
    type: String,
    required: true,
  },
  experience: String,
  location: {
    type: String,
    default: 'Doha',
  },
  status: {
    type: String,
    enum: ['Pending', 'Interview', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150',
  },
  idDocumentUrl: String,
  nationality: String,
  dob: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female'],
  },
  height: String,
  weight: String,
  shirtSize: String,
  cvUrl: String,
  languages: [String],
  quizScore: Number,
  quizDetails: [quizAnswerSchema],
  interviewDate: Date,
  interviewTime: String,
  interviewLocation: String,
  interviewer: String,
  interviewNotes: String,
  meetingLink: String,
  interviewType: {
    type: String,
    enum: ['local', 'online'],
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffProfile',
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  qidNumber: String,
}, {
  timestamps: true,
});

// Add indexes for frequently queried fields
jobApplicationSchema.index({ eventId: 1, staffId: 1 });
jobApplicationSchema.index({ email: 1, eventId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedDate: -1 });
jobApplicationSchema.index({ staffId: 1, status: 1 });

export default mongoose.model('JobApplication', jobApplicationSchema);

