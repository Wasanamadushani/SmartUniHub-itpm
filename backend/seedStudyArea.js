const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Seat = require('./models/Seat');
const Booking = require('./models/Booking');
const Fine = require('./models/Fine');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedData() {
  try {
    console.log('Seeding study area data...');

    // 1. Create a default user if none
    let user = await User.findOne({ email: 'student@sliit.lk' });
    if (!user) {
      user = await User.create({
        name: 'Test Student',
        email: 'student@sliit.lk',
        password: 'password123',
        role: 'user',
      });
      console.log('Created test student');
    }

    // 2. Load seats (we assume bookingController already populated it or we can just fetch some)
    let seats = await Seat.find().limit(3);
    if (seats.length === 0) {
      // populate a few seats
      await Seat.insertMany([
        { tableId: 1, seatNumber: 1 },
        { tableId: 1, seatNumber: 2 },
        { tableId: 2, seatNumber: 1 },
      ]);
      seats = await Seat.find().limit(3);
      console.log('Created dummy seats');
    }

    // 3. Create Bookings
    const pendingBooking = await Booking.findOne({ status: 'booked' });
    if (!pendingBooking) {
      await Booking.create({
        user: user._id,
        seat: seats[0]._id,
        bookingDate: new Date(),
        startTime: '09:00',
        endTime: '11:00',
        status: 'booked'
      });
      
      await Booking.create({
        user: user._id,
        seat: seats[1]._id,
        bookingDate: new Date(),
        startTime: '13:00',
        endTime: '15:00',
        status: 'occupied' // already occupied
      });
      console.log('Created dummy bookings');
    }

    // 4. Create Fines
    const fine = await Fine.findOne({});
    if (!fine) {
      await Fine.create({
        user: user._id,
        amount: 500,
        reason: 'Late arrival',
        status: 'unpaid'
      });
      console.log('Created dummy fine');
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
