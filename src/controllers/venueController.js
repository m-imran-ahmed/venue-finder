const Venue = require("../models/Venue");
const mongoose = require("mongoose");

// Search venues (3+ letters)
exports.searchVenues = async (req, res) => {
  const { search } = req.query;
  
  if (!search || search.length < 3) {
    return res.status(400).json({ error: "Search term must be at least 3 letters" });
  }

  try {
    const venues = await Venue.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }).limit(10);

    res.json(venues);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all venues
exports.getAllVenues = async (req, res) => {
  try {
    const venues = await Venue.find();
    res.json(venues);
  } catch (err) {
    console.error('Get all venues error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get popular venues with sorting and filtering
exports.getPopularVenues = async (req, res) => {
  try {
    const {
      sortBy = 'rating',
      minPrice,
      maxPrice,
      minCapacity,
      maxCapacity,
      limit = 6
    } = req.query;

    // Build query
    const query = { availability: true };
    if (minPrice) query.dailyRate = { $gte: Number(minPrice) };
    if (maxPrice) query.dailyRate = { ...query.dailyRate, $lte: Number(maxPrice) };
    if (minCapacity) query.capacity = { $gte: Number(minCapacity) };
    if (maxCapacity) query.capacity = { ...query.capacity, $lte: Number(maxCapacity) };

    // Build sort object
    const sortOptions = {
      rating: { rating: -1 },
      price: { dailyRate: 1 },
      capacity: { capacity: -1 },
      newest: { createdAt: -1 }
    };

    const venues = await Venue.find(query)
      .sort(sortOptions[sortBy] || sortOptions.rating)
      .limit(Number(limit))
      .populate('amenities');

    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get venue by ID with populated amenities
exports.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided
    if (!id) {
      return res.status(400).json({ message: 'Venue ID is required' });
    }
    
    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid venue ID format' });
    }
    
    const venue = await Venue.findById(id).populate('amenities');
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue by ID:', error);
    res.status(500).json({ message: 'Server error while fetching venue' });
  }
};

// Search venues by location
exports.searchVenuesByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query; // radius in meters

    const venues = await Venue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radius)
        }
      }
    }).populate('amenities');

    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 