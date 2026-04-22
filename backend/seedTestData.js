require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Seat = require('./models/Seat');
const Booking = require('./models/Booking');
const ArrivalConfirmation = require('./models/ArrivalConfirmation');
const Fine = require('./models/Fine');

async function seedTestData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing test data
    await Booking.deleteMany({});
    await ArrivalConfirmation.deleteMany({});
    await Fine.deleteMany({});
    console.log('Cleared existing test data');

    // Find or create test users
    let testStudent = await User.findOne({ email: 'student@test.com' });
    if (!testStudent) {
      testStudent = await User.create({
        name: 'Test Student',
        studentId: 'IT001',
        email: 'student@test.com',
        role: 'rider',
        password: 'test123', // In real app, this would be hashed
        phone: '0771234567',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'blue'
      });
      console.log('Created test student:', testStudent._id);
    }

    let testAdmin = await User.findOne({ email: 'admin@test.com' });
    if (!testAdmin) {
      testAdmin = await User.create({
        name: 'Test Admin',
        studentId: 'ADM001',
        email: 'admin@test.com',
        role: 'admin',
        password: 'admin123',
        phone: '0779876543',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'red'
      });
      console.log('Created test admin:', testAdmin._id);
    }

    // Get a seat
    let seat = await Seat.findOne({});
    if (!seat) {
      console.log('No seats found. Creating them...');
      const seats = [];
      for (let tableId = 1; tableId <= 70; tableId++) {
        for (let seatNumber = 1; seatNumber <= 4; seatNumber++) {
          seats.push({ tableId, seatNumber });
        }
      }
      await Seat.insertMany(seats);
      seat = await Seat.findOne({});
    }

    // Create 2 test bookings with different scenarios
    // Scenario 1: Student marked arrival (pending admin approval)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const booking1 = await Booking.create({
      user: testStudent._id,
      seat: seat._id,
      bookingDate: today,
      startTime: '09:00',
      endTime: '11:00',
      status: 'booked'
    });
    console.log('Created booking 1:', booking1._id);

    // Create arrival confirmation for booking 1 (student marked arrival, pending admin action)
    await ArrivalConfirmation.create({
      booking: booking1._id,
      studentConfirmed: true,
      studentConfirmedAt: new Date(),
      status: 'pending'
    });
    console.log('Created pending arrival for booking 1');

    // Scenario 2: Booking where admin marked no-show (auto-created fine)
    let seat2 = await Seat.findOne({ _id: { $ne: seat._id } });
    if (!seat2) {
      seat2 = seat;
    }

    const booking2 = await Booking.create({
      user: testStudent._id,
      seat: seat2._id,
      bookingDate: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      startTime: '14:00',
      endTime: '16:00',
      status: 'completed' // Status in Booking model, no_show will be tracked in ArrivalConfirmation
    });
    console.log('Created booking 2 (completed):', booking2._id);

    // Create arrival confirmation with no_show status and unpaid fine
    await ArrivalConfirmation.create({
      booking: booking2._id,
      status: 'no_show'
    });

    // Create fine for booking 2
    await Fine.create({
      user: testStudent._id,
      booking: booking2._id,
      amount: 100,
      reason: 'Student was not present at booked study seat',
      status: 'unpaid'
    });
    console.log('Created unpaid fine for booking 2');

    console.log('\n✅ Test data seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Student: student@test.com / test123');
    console.log('Admin: admin@test.com / admin123');
    console.log('\nExpected Results:');
    console.log('- Admin Dashboard should show 1 pending arrival and 1 unpaid fine');
    console.log('- Admin can confirm/reject arrival');
    console.log('- Admin can mark fine as paid');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
