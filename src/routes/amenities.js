const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');

// Get all amenities
router.get('/', amenityController.getAllAmenities);

// Get amenities by category
router.get('/category/:category', amenityController.getAmenitiesByCategory);

// Add new amenity
router.post('/', amenityController.addAmenity);

module.exports = router; 