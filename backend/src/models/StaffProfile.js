import mongoose from 'mongoose';

const staffSkillSchema = new mongoose.Schema({
  name: String,
  status: {
    type: String,
    enum: ['Verified', 'Pending', 'Rejected'],
    default: 'Pending',
  },
});

const clientFeedbackSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  eventName: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  date: { type: Date, default: Date.now },
});

const staffDocumentSchema = new mongoose.Schema({
  title: String,
  type: {
    type: String,
    enum: ['ID', 'Passport', 'Certificate', 'Contract'],
  },
  uploadDate: { type: Date, default: Date.now },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['Verified', 'Pending', 'Expired', 'Rejected'],
    default: 'Pending',
  },
  url: String,
});

const staffProfileSchema = new mongoose.Schema({
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
  role: {
    type: String,
    required: true,
    enum: ['General Staff', 'Hostess', 'Security', 'Protocol', 'Logistics', 'Event Coordinator'],
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  status: {
    type: String,
    enum: ['Available', 'On Shift', 'Leave', 'Suspended'],
    default: 'Available',
  },
  skills: [staffSkillSchema],
  imageUrl: {
    type: String,
    default: 'https://i.pravatar.cc/150',
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: 'Doha',
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  feedback: [clientFeedbackSchema],
  completedShifts: {
    type: Number,
    default: 0,
  },
  onTimeRate: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  certifications: [String],
  xpPoints: {
    type: Number,
    default: 0,
  },
  level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Elite'],
    default: 'Bronze',
  },
  documents: [staffDocumentSchema],
  nationality: String,
  dob: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female'],
  },
  height: String,
  weight: String,
  shirtSize: String,
  languages: [String],
  qidNumber: String,
  galleryPhotos: [{
    url: String,
    thumbnail: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
    isProfilePicture: { type: Boolean, default: false },
  }],
}, {
  timestamps: true,
});

// Add indexes for frequently queried fields
staffProfileSchema.index({ userId: 1 }); // Already unique, but explicit index
staffProfileSchema.index({ email: 1 });
staffProfileSchema.index({ status: 1 });
staffProfileSchema.index({ role: 1 });
staffProfileSchema.index({ location: 1 });
staffProfileSchema.index({ status: 1, role: 1 }); // Compound index for filtering
staffProfileSchema.index({ rating: -1 }); // For sorting by rating

export default mongoose.model('StaffProfile', staffProfileSchema);

