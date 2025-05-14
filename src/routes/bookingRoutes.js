const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Check venue availability
router.get('/check-availability', bookingController.checkAvailability);

// Create booking
router.post('/', bookingController.createBooking);

// Cancel booking
router.put('/:id/cancel', bookingController.cancelBooking);

// Reschedule booking
router.put('/:id/reschedule', bookingController.rescheduleBooking);

// Get user's bookings
router.get('/user', bookingController.getUserBookings);

module.exports = router; 