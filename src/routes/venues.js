const express = require('express');
const router = express.Router();
const { 
  searchVenues, 
  getAllVenues, 
  getPopularVenues, 
  getVenueById 
} = require("../controllers/venueController");

// GET all venues
router.get('/', getAllVenues);

// GET popular venues
router.get('/popular', getPopularVenues);

// Search venues by location or name
router.get('/location/:location', searchVenues);

// Get venue by ID (must be last)
router.get('/:id', getVenueById);

module.exports = router; 