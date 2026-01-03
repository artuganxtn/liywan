import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  caption: String,
  tags: [String],
}, {
  timestamps: true,
});

export default mongoose.model('Gallery', gallerySchema);

