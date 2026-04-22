const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const ArrivalConfirmation = require('../models/ArrivalConfirmation');
const Fine = require('../models/Fine');
const User = require('../models/User');

const createDefaultSeats = async () => {
  const existing = await Seat.countDocuments();
  if (existing > 0) {
    return;
  }

  const seats = [];
  for (let tableId = 1; tableId <= 70; tableId += 1) {
    for (let seatNumber = 1; seatNumber <= 4; seatNumber += 1) {
      seats.push({ tableId, seatNumber });
    }
  }

  await Seat.insertMany(seats);
};

const parseDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getSeats = async (req, res) => {
  try {
    await createDefaultSeats();

    const { date, startTime, endTime } = req.query;
    const bookingDate = date ? parseDate(date) : parseDate(new Date());

    const conflictQuery = {
      bookingDate,
      status: { $in: ['booked', 'occupied'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        { startTime: { $gte: startTime, $lt: endTime } }
      ]
    };

    const bookings = await Booking.find(conflictQuery).select('seat');
    const bookedSeatIds = bookings.map((booking) => booking.seat.toString());

    const seats = await Seat.find().sort({ tableId: 1, seatNumber: 1 }).lean();
    const seatList = seats.map((seat) => ({
      ...seat,
      status: bookedSeatIds.includes(seat._id.toString()) ? 'booked' : 'available'
    }));

    res.status(200).json(seatList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const { userId, seatId, date, startTime, endTime } = req.body;

    if (!userId || !seatId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'All booking fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found' });
    }

    const bookingDate = parseDate(date);

    const existingBooking = await Booking.findOne({
      user: userId,
      status: { $in: ['booked', 'occupied'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have an active booking' });
    }

    const conflictBooking = await Booking.findOne({
      seat: seatId,
      bookingDate,
      status: { $in: ['booked', 'occupied'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        { startTime: { $gte: startTime, $lt: endTime } }
      ]
    });

    if (conflictBooking) {
      return res.status(409).json({ message: 'This seat is already booked for the selected time' });
    }

    const booking = await Booking.create({
      user: userId,
      seat: seatId,
      bookingDate,
      startTime,
      endTime,
      status: 'booked'
    });

    const populatedBooking = await Booking.findById(booking._id).populate('seat');
    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveBookingByUser = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      user: req.params.userId,
      status: { $in: ['booked', 'occupied'] }
    }).populate('seat');

    res.status(200).json(booking || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be completed' });
    }

    booking.status = 'completed';
    await booking.save();

    res.status(200).json({ message: 'Booking completed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markArrival = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'booked') {
      return res.status(400).json({ message: 'Arrival cannot be marked for this booking' });
    }

    let arrivalConfirmation = await ArrivalConfirmation.findOne({ booking: req.params.bookingId });
    
    if (!arrivalConfirmation) {
      arrivalConfirmation = await ArrivalConfirmation.create({
        booking: req.params.bookingId,
        studentConfirmed: true,
        studentConfirmedAt: new Date(),
        status: 'pending'
      });
    } else {
      arrivalConfirmation.studentConfirmed = true;
      arrivalConfirmation.studentConfirmedAt = new Date();
      await arrivalConfirmation.save();
    }

    res.status(200).json({ message: 'Arrival marked successfully. Waiting for admin confirmation.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingArrivals = async (req, res) => {
  try {
    const arrivals = await ArrivalConfirmation.find({ status: 'pending' })
      .populate({
        path: 'booking',
        populate: { path: 'user seat' }
      })
      .sort({ studentConfirmedAt: -1 });

    const results = arrivals.map((arrival) => ({
      arrival_id: arrival._id,
      booking_id: arrival.booking._id,
      student_name: arrival.booking.user.name,
      student_email: arrival.booking.user.email,
      table_id: arrival.booking.seat.tableId,
      seat_number: arrival.booking.seat.seatNumber,
      booking_date: arrival.booking.bookingDate,
      start_time: arrival.booking.startTime,
      end_time: arrival.booking.endTime,
      student_confirmed: arrival.studentConfirmed,
      student_confirmed_at: arrival.studentConfirmedAt,
      status: arrival.status,
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmArrivalByAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { admin_id } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    let arrivalConfirmation = await ArrivalConfirmation.findOne({ booking: bookingId });
    if (!arrivalConfirmation) {
      arrivalConfirmation = await ArrivalConfirmation.create({
        booking: bookingId,
        studentConfirmed: false,
        adminConfirmed: true,
        adminConfirmedAt: new Date(),
        admin: admin_id,
        status: 'confirmed'
      });
    } else {
      arrivalConfirmation.adminConfirmed = true;
      arrivalConfirmation.adminConfirmedAt = new Date();
      arrivalConfirmation.admin = admin_id;
      arrivalConfirmation.status = 'confirmed';
      await arrivalConfirmation.save();
    }

    booking.status = 'occupied';
    await booking.save();

    res.status(200).json({ message: 'Arrival confirmed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNoShowByAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { admin_id, fine_amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    let arrivalConfirmation = await ArrivalConfirmation.findOne({ booking: bookingId });
    if (!arrivalConfirmation) {
      arrivalConfirmation = await ArrivalConfirmation.create({
        booking: bookingId,
        adminConfirmed: false,
        adminConfirmedAt: new Date(),
        admin: admin_id,
        status: 'no_show'
      });
    } else {
      arrivalConfirmation.adminConfirmed = false;
      arrivalConfirmation.adminConfirmedAt = new Date();
      arrivalConfirmation.admin = admin_id;
      arrivalConfirmation.status = 'no_show';
      await arrivalConfirmation.save();
    }

    booking.status = 'completed';
    await booking.save();

    const fine = await Fine.create({
      user: booking.user,
      booking: bookingId,
      amount: fine_amount || 100,
      reason: 'Student was not present at booked study seat',
      status: 'unpaid'
    });

    res.status(200).json({ message: 'Marked as no-show and fine created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('seat', 'tableId seatNumber')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSeats,
  createBooking,
  getActiveBookingByUser,
  completeBooking,
  cancelBooking,
  markArrival,
  getPendingArrivals,
  confirmArrivalByAdmin,
  markNoShowByAdmin,
  getAllBookings,
};
