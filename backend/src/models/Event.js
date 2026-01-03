import mongoose from 'mongoose';

const eventBudgetSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  staffingAllocated: { type: Number, default: 0 },
  logisticsAllocated: { type: Number, default: 0 },
  marketingAllocated: { type: Number, default: 0 },
  cateringAllocated: { type: Number, default: 0 },
  technologyAllocated: { type: Number, default: 0 },
  miscellaneousAllocated: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
});

const eventRoleSchema = new mongoose.Schema({
  roleName: String,
  count: { type: Number, default: 0 },
  filled: { type: Number, default: 0 },
});

const locationSchema = new mongoose.Schema({
  address: String,
  city: { type: String, default: 'Doha' },
  country: { type: String, default: 'Qatar' },
  coordinates: {
    lat: Number,
    lng: Number,
  },
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
  },
  description: String,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
  },
  location: {
    type: locationSchema,
    required: true,
  },
  startAt: {
    type: Date,
    required: true,
  },
  endAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'LIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  },
  requiredRoles: {
    type: Map,
    of: Number,
    default: {},
  },
  staffRequired: {
    type: Number,
    default: 0,
  },
  staffAssigned: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  budget: eventBudgetSchema,
  imageUrl: String,
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupervisorProfile',
  },
  assignments: [{
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile' },
    role: String,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    assignedAt: { type: Date, default: Date.now },
    payment: {
      type: {
        type: String,
        enum: ['hourly', 'fixed', 'daily'],
        default: 'hourly',
      },
      hourlyRate: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
      fixedAmount: { type: Number, default: 0 },
      overtimeRate: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      transportationAllowance: { type: Number, default: 0 },
      mealAllowance: { type: Number, default: 0 },
      totalPayment: { type: Number, default: 0 },
      notes: { type: String, default: '' },
    },
  }],
}, {
  timestamps: true,
});

// Calculate staffRequired from requiredRoles
eventSchema.pre('save', function (next) {
  if (this.requiredRoles && this.requiredRoles instanceof Map) {
    let total = 0;
    this.requiredRoles.forEach((count) => {
      total += count;
    });
    this.staffRequired = total;
  }
  next();
});

// Add indexes for frequently queried fields
eventSchema.index({ startAt: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ clientId: 1 });
eventSchema.index({ supervisorId: 1 });
eventSchema.index({ startAt: 1, status: 1 }); // Compound index for common queries
eventSchema.index({ 'assignments.staffId': 1 });

// Explicitly set collection name to 'events' (lowercase, plural)
export default mongoose.model('Event', eventSchema, 'events');

