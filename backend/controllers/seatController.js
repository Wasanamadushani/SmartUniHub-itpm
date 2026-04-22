const Seat = require('../models/Seat');
const Booking = require('../models/Booking');

exports.getAllSeats = async (req, res) => {
  try {
    const seats = await Seat.find().sort({ tableId: 1, seatNumber: 1 });
    // Find active bookings (booked or occupied today/now)
    // For simplicity, we just look for active status
    const activeBookings = await Booking.find({ 
      status: { $in: ['booked', 'occupied'] } 
    }).populate('user', 'name');

    const formattedSeats = seats.map(seat => {
      const activeBooking = activeBookings.find(b => b.seat && b.seat.toString() === seat._id.toString());
      
      return {
        _id: seat._id,
        seatId: `T${seat.tableId}-S${seat.seatNumber}`,
        location: `Table ${seat.tableId}`,
        status: activeBooking ? activeBooking.status : 'available',
        bookedBy: activeBooking && activeBooking.user ? { name: activeBooking.user.name } : null
      };
    });

    res.status(200).json(formattedSeats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSeat = async (req, res) => {
  try {
    const seat = await Seat.create(req.body);
    res.status(201).json(seat);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Seat already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found' });
    }
    // Also delete any pending bookings for this seat? (Optional, but let's just delete the seat for now)
    await Seat.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Seat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSeat = async (req, res) => {
  try {
    const { tableId, seatNumber } = req.body;
    const seat = await Seat.findByIdAndUpdate(
      req.params.id,
      { tableId, seatNumber },
      { new: true, runValidators: true }
    );
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found' });
    }
    res.status(200).json(seat);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A seat with that Table ID and Seat Number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};
