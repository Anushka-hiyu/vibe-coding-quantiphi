import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  placeId: String, address: String,
  latitude: { type: Number, default: null }, longitude: { type: Number, default: null },
  rating: { type: Number, min: 0, max: 5, default: null },
  notes: String, image: String, category: { type: String, default: 'Attraction' }
}, { _id: true });

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String, date: { type: Date, required: true },
  startTime: String, endTime: String,
  category: { type: String, default: 'Sightseeing' },
  estimatedCost: { type: Number, min: 0, default: 0 },
  actualCost: { type: Number, min: 0, default: 0 },
  notes: String, destinationId: String
}, { _id: true });

const tripSchema = new mongoose.Schema({
  tripName: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalBudget: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['Planning', 'Upcoming', 'Ongoing', 'Completed'], default: 'Planning' },
  coverImage: String,
  destinations: [destinationSchema],
  activities: [activitySchema]
}, { timestamps: true });

tripSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date cannot be before start date');
  }
  next();
});

export default mongoose.model('Trip', tripSchema);
