import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  fileUrl: { type: String, required: true },
  mimeType: String,
  size: Number
}, { timestamps: true });
export default mongoose.model('Document', schema);
