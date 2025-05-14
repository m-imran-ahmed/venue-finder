const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  icon: {
    type: String,
    required: false
  },
  category: {
    type: String,
    enum: ['basic', 'luxury', 'technical', 'catering', 'other'],
    default: 'basic'
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Amenity', amenitySchema); 