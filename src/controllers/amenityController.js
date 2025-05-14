const Amenity = require('../models/Amenity');

// Get all amenities
exports.getAllAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find().sort({ category: 1, name: 1 });
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get amenities by category
exports.getAmenitiesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const amenities = await Amenity.find({ category }).sort({ name: 1 });
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new amenity
exports.addAmenity = async (req, res) => {
  try {
    const amenity = new Amenity(req.body);
    const savedAmenity = await amenity.save();
    res.status(201).json(savedAmenity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 