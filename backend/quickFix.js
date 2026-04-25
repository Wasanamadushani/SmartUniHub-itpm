const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function quickFix() {
  try {
    console.log('\n🔧 QUICK FIX: Making all events bookable...\n');

    // Update ALL events to be bookable
    const result = await Event.updateMany(
      {},
      {
        $set: {
          eventType: 'indoor',
          totalSeats: 100,
          ticketPrice: 500,
          status: 'approved'
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} event(s)`);

    // Show all events
    const events = await Event.find({});
    console.log(`\n📋 All Events (${events.length} total):\n`);
    
    events.forEach(event => {
      console.log(`✓ ${event.title}`);
      console.log(`  Status: ${event.status}`);
      console.log(`  Type: ${event.eventType}`);
      console.log(`  Seats: ${event.totalSeats}`);
      console.log(`  Price: Rs. ${event.ticketPrice}`);
      console.log('');
    });

    console.log('✅ All events are now bookable!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server (Ctrl+C then npm start)');
    console.log('2. Refresh the /book-event page in your browser');
    console.log('3. The "Route not found" error should be gone');
    console.log('4. "Proceed to Payment" button should work\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    process.exit(1);
  }
}

quickFix();
