const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
  userId: { type: String, required: true }, // Replace with auth later
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, default: "confirmed" }, // confirmed/cancelled
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Booking", bookingSchema); 