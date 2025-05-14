const Venue = require("../models/Venue");
const Booking = require("../models/Booking");

// Import date utilities
const { 
  setToStartOfDay,
  setToEndOfDay,
  isValidBookingDate,
  validateRescheduleDate,
  isDateBooked,
  isSameDay
} = require('../utils/dateUtils');

// Create Booking
exports.createBooking = async (req, res) => {
  const { venueId, userId, startDate, endDate, guestCount } = req.body;

  if (!venueId || !startDate || !endDate) {
    return res.status(400).json({ 
      error: "Missing required parameters: venueId, startDate, and endDate are required" 
    });
  }

  try {
    console.log('Creating booking with data:', req.body);
    
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    // Convert dates to Date objects for comparison
    const requestedStartDate = new Date(startDate);
    const requestedEndDate = new Date(endDate);

    // Validate dates
    if (isNaN(requestedStartDate.getTime()) || isNaN(requestedEndDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Check if the date is a Monday
    const dayOfWeek = requestedStartDate.getDay();
    if (dayOfWeek === 1) { // Monday
      return res.status(400).json({ error: "Venue is closed on Mondays" });
    }

    // Check if the date is before May 8, 2025
    const startDateLimit = new Date('2025-05-08');
    startDateLimit.setHours(0, 0, 0, 0);
    if (requestedStartDate < startDateLimit) {
      return res.status(400).json({ error: "Bookings are only available from May 8, 2025 onwards" });
    }

    // Check for overlapping dates
    const isBooked = venue.bookings.some((booking) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      return (
        (requestedStartDate >= bookingStart && requestedStartDate <= bookingEnd) ||
        (requestedEndDate >= bookingStart && requestedEndDate <= bookingEnd) ||
        (requestedStartDate <= bookingStart && requestedEndDate >= bookingEnd)
      );
    });

    if (isBooked) {
      return res.status(400).json({ error: "Venue not available for these dates" });
    }

    // Create booking with default userId if not provided
    const newBooking = await Booking.create({
      venueId,
      userId: userId || "guest-user",
      startDate: requestedStartDate,
      endDate: requestedEndDate,
      guestCount: guestCount || 1, // Default to 1 if not provided
      status: 'confirmed'
    });

    // Update venue bookings
    venue.bookings.push({ 
      startDate: requestedStartDate, 
      endDate: requestedEndDate 
    });
    await venue.save();

    console.log('Booking created successfully:', newBooking);
    res.status(201).json(newBooking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Cancel Booking
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    // Remove booking from venue
    const venue = await Venue.findById(booking.venueId);
    if (venue) {
      venue.bookings = venue.bookings.filter(b => 
        b.startDate.toString() !== booking.startDate.toString() ||
        b.endDate.toString() !== booking.endDate.toString()
      );
      await venue.save();
    }

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    // TODO: Replace with actual user ID from auth
    const userId = req.user?._id || 'mock-user-id';
    
    const bookings = await Booking.find({ userId })
      .populate('venueId', 'name imageUrl location')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      venueName: booking.venueId.name,
      venueImage: booking.venueId.imageUrl,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      status: booking.status
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Check Venue Availability
exports.checkAvailability = async (req, res) => {
  const { venueId, startDate, endDate } = req.query;

  if (!venueId || !startDate || !endDate) {
    return res.status(400).json({ 
      error: "Missing required parameters: venueId, startDate, and endDate are required" 
    });
  }

  try {
    console.log('Checking availability for venue:', venueId);
    console.log('Start date:', startDate);
    console.log('End date:', endDate);
    
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Convert dates to Date objects for comparison
    const requestedStartDate = new Date(startDate);
    const requestedEndDate = new Date(endDate);
    
    // Validate dates
    if (isNaN(requestedStartDate.getTime()) || isNaN(requestedEndDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    
    // Check if the date is valid for booking
    const { valid, reason } = isValidBookingDate(requestedStartDate);
    if (!valid) {
      return res.json({ 
        available: false, 
        reason 
      });
    }

    // Check for overlapping bookings in the venue's bookings array
    const hasOverlappingBooking = venue.bookings.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      // Check if the requested date range overlaps with any existing booking
      return (
        (requestedStartDate <= bookingEnd && requestedEndDate >= bookingStart)
      );
    });

    if (hasOverlappingBooking) {
      return res.json({ 
        available: false, 
        reason: "Venue is already booked for this date" 
      });
    }

    // Also check the Booking collection for any overlapping bookings
    const overlappingBooking = await Booking.findOne({
      venueId,
      status: "confirmed",
      $or: [
        {
          // Requested start date falls within an existing booking
          startDate: { $lte: requestedEndDate },
          endDate: { $gte: requestedStartDate }
        }
      ]
    });

    console.log('Availability result:', {
      available: !overlappingBooking,
      reason: overlappingBooking ? "Venue is already booked for this date" : null
    });

    res.json({ 
      available: !overlappingBooking,
      reason: overlappingBooking ? "Venue is already booked for this date" : null
    });
  } catch (err) {
    console.error('Check availability error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Reschedule Booking
exports.rescheduleBooking = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if the new dates are available
    const venue = await Venue.findById(booking.venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // First validate the rescheduling date
    const requestedStartDate = new Date(startDate);
    const requestedEndDate = new Date(endDate);
    
    // Validate reschedule date
    const { valid, reason } = validateRescheduleDate(booking.startDate, requestedStartDate);
    if (!valid) {
      return res.status(400).json({ error: reason });
    }

    // Check for overlapping dates (excluding the current booking)
    const hasOverlappingBooking = isDateBooked(
      venue.bookings, 
      requestedStartDate, 
      booking._id
    );

    if (hasOverlappingBooking) {
      return res.status(400).json({ error: "Venue not available for these dates" });
    }

    // Update booking dates
    booking.startDate = requestedStartDate;
    booking.endDate = requestedEndDate;
    await booking.save();

    // Update venue bookings
    const venueBookingIndex = venue.bookings.findIndex(b => 
      isSameDay(b.startDate, booking.startDate) &&
      isSameDay(b.endDate, booking.endDate)
    );

    if (venueBookingIndex !== -1) {
      venue.bookings[venueBookingIndex] = {
        startDate: requestedStartDate,
        endDate: requestedEndDate
      };
      await venue.save();
    }

    res.json({ message: "Booking rescheduled successfully", booking });
  } catch (err) {
    console.error('Reschedule booking error:', err);
    res.status(500).json({ error: err.message });
  }
}; 