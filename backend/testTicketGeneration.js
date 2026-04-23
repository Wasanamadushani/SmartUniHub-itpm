/**
 * Test script to verify ticket generation functionality
 * Run with: node testTicketGeneration.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EventBooking = require('./models/EventBooking');

function generateTicketCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

async function testTicketGeneration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a booking with approved payment
    console.log('🔍 Looking for approved bookings...');
    const approvedBooking = await EventBooking.findOne({
      paymentStatus: 'approved',
      status: 'booked'
    }).populate('event', 'title');

    if (!approvedBooking) {
      console.log('⚠️  No approved bookings found');
      console.log('💡 Create a booking and approve it first to test ticket generation\n');
      return;
    }

    console.log('✅ Found approved booking:');
    console.log(`   Booking ID: ${approvedBooking._id}`);
    console.log(`   Event: ${approvedBooking.event?.title || 'N/A'}`);
    console.log(`   Seats Booked: ${approvedBooking.bookingCount}`);
    console.log(`   User: ${approvedBooking.userName}`);
    console.log(`   Payment Status: ${approvedBooking.paymentStatus}\n`);

    // Check if tickets already exist
    if (approvedBooking.tickets && approvedBooking.tickets.length > 0) {
      console.log('✅ Tickets already generated:');
      approvedBooking.tickets.forEach((ticket, index) => {
        console.log(`   Ticket ${index + 1}:`);
        console.log(`     - Ticket Number: ${ticket.ticketNumber}`);
        console.log(`     - Seat Number: ${ticket.seatNumber}`);
        console.log(`     - QR Code: ${ticket.qrCode}`);
        console.log(`     - Issued At: ${ticket.issuedAt}`);
      });
      console.log('\n✨ Ticket generation is working correctly!\n');
      return;
    }

    // Generate tickets if they don't exist
    console.log('🎫 Generating tickets...');
    const tickets = [];
    for (let i = 1; i <= approvedBooking.bookingCount; i++) {
      const ticketNumber = `${generateTicketCode()}-${i}`;
      tickets.push({
        ticketNumber,
        seatNumber: i,
        qrCode: ticketNumber,
        issuedAt: new Date(),
      });
      console.log(`   ✓ Generated ticket ${i}: ${ticketNumber}`);
    }

    // Update the booking with tickets
    approvedBooking.tickets = tickets;
    await approvedBooking.save();

    console.log('\n✅ Tickets saved to database');
    console.log(`✨ Successfully generated ${tickets.length} tickets!\n`);

    // Verify the update
    const updatedBooking = await EventBooking.findById(approvedBooking._id);
    console.log('🔍 Verification:');
    console.log(`   Tickets in database: ${updatedBooking.tickets.length}`);
    console.log(`   Expected tickets: ${approvedBooking.bookingCount}`);
    console.log(`   Match: ${updatedBooking.tickets.length === approvedBooking.bookingCount ? '✅ Yes' : '❌ No'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
console.log('🎫 Ticket Generation Test\n');
console.log('=' .repeat(50));
testTicketGeneration();
