const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    formattedAddress: String
  },
  imageUrl: {
    type: String,
    required: true
  },
  dailyRate: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  amenities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity'
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  availability: {
    type: Boolean,
    default: true
  },
  bookings: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for geospatial queries
venueSchema.index({ location: '2dsphere' });

// Index for sorting and filtering
venueSchema.index({ dailyRate: 1 });
venueSchema.index({ capacity: 1 });
venueSchema.index({ rating: -1 });
venueSchema.index({ isPopular: 1 });

// Update the updatedAt timestamp before saving
venueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Venue', venueSchema); 