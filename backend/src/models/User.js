import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'STAFF', 'CLIENT', 'SUPERVISOR'],
    required: true,
    default: 'STAFF',
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

// Add indexes for frequently queried fields
userSchema.index({ email: 1 }); // Already unique, but explicit index helps with lookups
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1, isActive: 1 }); // Compound index

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
  }
  return jwt.sign({ id: this._id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate refresh token
userSchema.methods.getRefreshToken = function () {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET is not configured. Please set it in your .env file.');
  }
  return jwt.sign({ id: this._id }, secret.trim(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);

