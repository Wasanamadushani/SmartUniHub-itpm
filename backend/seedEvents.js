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
      event = await Event.create({
        title: 'SLIIT Got Talent 2024',
        description: 'Annual talent show of SLIIT',
        location: 'Main Auditorium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: 'pending',
        category: 'entertainment'
      });
      
      await Event.create({
        title: 'Career Fair 2024',
        description: 'Meet your future employers',
        location: 'Ground Floor Lobby',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: 'approved',
        category: 'educational'
      });
      console.log('Created dummy events');
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
