const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixExistingEvents() {
  try {
    console.log('Fixing existing events to make them bookable...');

    // Find all events that are approved but missing booking fields
    const events = await Event.find({
      status: 'approved',
      $or: [
        { eventType: { $exists: false } },
        { eventType: null },
        { totalSeats: { $exists: false } },
        { totalSeats: null },
        { ticketPrice: { $exists: false } },
        { ticketPrice: null }
      ]
    });

    console.log(`Found ${events.length} events that need fixing`);

    for (const event of events) {
      // Set default values to make events bookable
      if (!event.eventType) {
        event.eventType = 'indoor';
      }
      
      if (!event.totalSeats || event.totalSeats <= 0) {
        event.totalSeats = 100; // Default 100 seats
      }
      
      if (event.ticketPrice === undefined || event.ticketPrice === null) {
        event.ticketPrice = 500; // Default Rs. 500
      }

      await event.save();
      console.log(`✓ Fixed event: ${event.title}`);
      console.log(`  - Type: ${event.eventType}`);
      console.log(`  - Seats: ${event.totalSeats}`);
      console.log(`  - Price: Rs. ${event.ticketPrice}`);
    }

    // Also check for pending events and show them
    const pendingEvents = await Event.find({ status: 'pending' });
    if (pendingEvents.length > 0) {
      console.log(`\n⚠ Found ${pendingEvents.length} pending events that need admin approval:`);
      pendingEvents.forEach(event => {
        console.log(`  - ${event.title} (ID: ${event._id})`);
      });
      console.log('\nTo approve these events, use the Admin Dashboard or run:');
      console.log('  Event.findByIdAndUpdate("<event_id>", { status: "approved" })');
    }

    console.log('\n✓ Event fixing completed!');
    console.log('\nBookable events now available:');
    
    const bookableEvents = await Event.find({
      status: 'approved',
      eventType: 'indoor',
      totalSeats: { $gt: 0 }
    });

    bookableEvents.forEach(event => {
      console.log(`  ✓ ${event.title}`);
      console.log(`    Location: ${event.location}`);
      console.log(`    Seats: ${event.totalSeats}`);
      console.log(`    Price: Rs. ${event.ticketPrice}`);
      console.log(`    Date: ${event.startDate.toLocaleDateString()}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Event fixing failed:', error);
    process.exit(1);
  }
}

fixExistingEvents();
