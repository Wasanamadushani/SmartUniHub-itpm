const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const EventStall = require('./models/EventStall');
const EventBooking = require('./models/EventBooking');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedEvents() {
  try {
    console.log('Seeding events management data...');

    // 1. Get a user
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

    // 2. Create some events
    const existingEvents = await Event.find({});
    let event;
    if (existingEvents.length === 0) {
      // Create a bookable indoor event (approved, with seats and price)
      event = await Event.create({
        title: 'SLIIT Got Talent 2024',
        description: 'Annual talent show of SLIIT - Book your seats now!',
        location: 'Main Auditorium',
        startDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
        endDate: new Date(Date.now() + 86400000 * 8), // 8 days from now
        eventType: 'indoor',
        totalSeats: 100,
        ticketPrice: 500,
        status: 'approved'
      });
      
      // Create another bookable indoor event
      await Event.create({
        title: 'Tech Conference 2024',
        description: 'Latest trends in technology and innovation',
        location: 'Conference Hall A',
        startDate: new Date(Date.now() + 86400000 * 14), // 14 days from now
        endDate: new Date(Date.now() + 86400000 * 15), // 15 days from now
        eventType: 'indoor',
        totalSeats: 150,
        ticketPrice: 750,
        status: 'approved'
      });

      // Create an outdoor event (not bookable)
      await Event.create({
        title: 'Sports Day 2024',
        description: 'Annual sports meet - Free entry, no booking required',
        location: 'Sports Ground',
        startDate: new Date(Date.now() + 86400000 * 21), // 21 days from now
        endDate: new Date(Date.now() + 86400000 * 22), // 22 days from now
        eventType: 'outdoor',
        status: 'approved'
      });

      // Create a pending event (not bookable yet)
      await Event.create({
        title: 'Music Festival 2024',
        description: 'Live music performances - Awaiting approval',
        location: 'Open Air Theater',
        startDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
        endDate: new Date(Date.now() + 86400000 * 31), // 31 days from now
        eventType: 'indoor',
        totalSeats: 200,
        ticketPrice: 1000,
        status: 'pending'
      });

      console.log('Created dummy events (2 bookable indoor events, 1 outdoor, 1 pending)');
    } else {
      event = existingEvents[0];
    }

    // 3. Create a Stall Request
    const existingStall = await EventStall.findOne({});
    if (!existingStall) {
      await EventStall.create({
        eventId: event._id,
        stallName: 'Tech Treats',
        category: 'Food',
        facultyName: 'Computing',
        status: 'pending',
        requestedByUserId: user._id
      });
      console.log('Created dummy stall request');
    }

    // 4. Create an Event Booking
    const existingBooking = await EventBooking.findOne({});
    if (!existingBooking) {
      await EventBooking.create({
        event: event._id,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        bookingCount: 2,
        paymentStatus: 'pending_verification',
        paymentMethod: 'card',
        paymentAmount: 500,
        paymentReceiptData: 'dummy_receipt_base64_data'
      });
      console.log('Created dummy event booking');
    }

    console.log('Events seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Events seeding failed:', error);
    process.exit(1);
  }
}

seedEvents();
