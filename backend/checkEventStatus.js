const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const EventBooking = require('./models/EventBooking');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkEventStatus() {
  try {
    console.log('='.repeat(60));
    console.log('EVENT BOOKING STATUS CHECK');
    console.log('='.repeat(60));

    const allEvents = await Event.find({}).sort({ createdAt: -1 });
    
    if (allEvents.length === 0) {
      console.log('\n❌ No events found in database!');
      console.log('\nTo create events, run: node seedEvents.js');
      process.exit(0);
    }

    console.log(`\nTotal Events: ${allEvents.length}\n`);

    // Categorize events
    const bookableEvents = [];
    const nonBookableEvents = [];

    for (const event of allEvents) {
      const isBookable = event.status === 'approved' 
                      && event.eventType === 'indoor' 
                      && event.totalSeats > 0
                      && event.ticketPrice !== undefined
                      && event.ticketPrice !== null;

      // Get booking stats
      const bookings = await EventBooking.aggregate([
        {
          $match: {
            event: event._id,
            status: 'booked',
          },
        },
        {
          $group: {
            _id: null,
            totalBooked: { $sum: '$bookingCount' },
          },
        },
      ]);

      const bookedSeats = bookings[0]?.totalBooked || 0;
      const remainingSeats = event.totalSeats ? Math.max(event.totalSeats - bookedSeats, 0) : 0;

      const eventInfo = {
        event,
        isBookable,
        bookedSeats,
        remainingSeats
      };

      if (isBookable) {
        bookableEvents.push(eventInfo);
      } else {
        nonBookableEvents.push(eventInfo);
      }
    }

    // Display bookable events
    if (bookableEvents.length > 0) {
      console.log('✅ BOOKABLE EVENTS (Users can book these)');
      console.log('-'.repeat(60));
      bookableEvents.forEach(({ event, bookedSeats, remainingSeats }) => {
        console.log(`\n📅 ${event.title}`);
        console.log(`   ID: ${event._id}`);
        console.log(`   Location: ${event.location || 'Not set'}`);
        console.log(`   Date: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`);
        console.log(`   Status: ${event.status} ✅`);
        console.log(`   Type: ${event.eventType} ✅`);
        console.log(`   Total Seats: ${event.totalSeats} ✅`);
        console.log(`   Booked: ${bookedSeats} | Remaining: ${remainingSeats}`);
        console.log(`   Ticket Price: Rs. ${event.ticketPrice} ✅`);
      });
      console.log('\n' + '='.repeat(60));
    } else {
      console.log('❌ NO BOOKABLE EVENTS FOUND!');
      console.log('-'.repeat(60));
    }

    // Display non-bookable events
    if (nonBookableEvents.length > 0) {
      console.log('\n⚠️  NON-BOOKABLE EVENTS (Need fixing)');
      console.log('-'.repeat(60));
      nonBookableEvents.forEach(({ event }) => {
        console.log(`\n📅 ${event.title}`);
        console.log(`   ID: ${event._id}`);
        
        // Show what's wrong
        const issues = [];
        if (event.status !== 'approved') {
          issues.push(`Status: ${event.status} (needs to be 'approved')`);
        }
        if (event.eventType !== 'indoor') {
          issues.push(`Type: ${event.eventType || 'not set'} (needs to be 'indoor')`);
        }
        if (!event.totalSeats || event.totalSeats <= 0) {
          issues.push(`Total Seats: ${event.totalSeats || 'not set'} (needs to be > 0)`);
        }
        if (event.ticketPrice === undefined || event.ticketPrice === null) {
          issues.push(`Ticket Price: not set (needs a value)`);
        }

        console.log(`   Issues:`);
        issues.forEach(issue => console.log(`   ❌ ${issue}`));
        
        console.log(`\n   To fix this event, run:`);
        console.log(`   Event.findByIdAndUpdate('${event._id}', {`);
        console.log(`     status: 'approved',`);
        console.log(`     eventType: 'indoor',`);
        console.log(`     totalSeats: 100,`);
        console.log(`     ticketPrice: 500`);
        console.log(`   })`);
      });
      console.log('\n' + '='.repeat(60));
    }

    // Summary and recommendations
    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(60));
    console.log(`✅ Bookable Events: ${bookableEvents.length}`);
    console.log(`⚠️  Non-Bookable Events: ${nonBookableEvents.length}`);
    console.log(`📝 Total Events: ${allEvents.length}`);

    if (bookableEvents.length === 0) {
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Run: node fixExistingEvents.js (to fix existing events)');
      console.log('   OR');
      console.log('2. Run: node seedEvents.js (to create new bookable events)');
      console.log('   OR');
      console.log('3. Use Admin Dashboard to edit events manually');
    } else {
      console.log('\n✅ You have bookable events! Users can now book tickets.');
      if (nonBookableEvents.length > 0) {
        console.log(`\n⚠️  ${nonBookableEvents.length} event(s) still need fixing.`);
        console.log('Run: node fixExistingEvents.js (to fix them)');
      }
    }

    console.log('\n' + '='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('Status check failed:', error);
    process.exit(1);
  }
}

checkEventStatus();
