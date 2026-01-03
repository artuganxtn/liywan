import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  contactPerson: {
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
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  totalEvents: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  imageUrl: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=Company&background=random',
  },
  // Additional company information
  address: String,
  city: {
    type: String,
    default: 'Doha',
  },
  country: {
    type: String,
    default: 'Qatar',
  },
  taxId: String,
  website: String,
  industry: String,
  companySize: String,
  notes: String,
}, {
  timestamps: true,
});

export default mongoose.model('ClientProfile', clientProfileSchema);

