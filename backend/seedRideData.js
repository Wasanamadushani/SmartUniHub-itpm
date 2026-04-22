require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Driver = require('./models/Driver');
const Ride = require('./models/Ride');

async function seedRideData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing ride data
    await Ride.deleteMany({});
    console.log('Cleared existing ride data');

    // Find or create test users
    let testRider = await User.findOne({ email: 'rider@test.com' });
    if (!testRider) {
      testRider = await User.create({
        name: 'Test Rider',
        studentId: 'IT002',
        email: 'rider@test.com',
        role: 'rider',
        password: 'test123',
        phone: '0771234568',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'blue'
      });
      console.log('Created test rider:', testRider._id);
    }

    let testDriver = await User.findOne({ email: 'driver@test.com' });
    if (!testDriver) {
      testDriver = await User.create({
        name: 'Test Driver',
        studentId: 'IT003',
        email: 'driver@test.com',
        role: 'driver',
        password: 'test123',
        phone: '0771234569',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'green'
      });
      console.log('Created test driver user:', testDriver._id);
    }

    // Find or create driver profile
    let driverProfile = await Driver.findOne({ user: testDriver._id });
    if (!driverProfile) {
      driverProfile = await Driver.create({
        user: testDriver._id,
        vehicleType: 'Sedan',
        vehicleNumber: 'CAR-1234',
        vehicleModel: 'Toyota Axio',
        licenseNumber: 'LIC-5678',
        capacity: 4,
        isAvailable: true,
        isApproved: true
      });
      console.log('Created driver profile:', driverProfile._id);
    }

    // Create test rides with real Sri Lankan coordinates
    // Ride 1: Pending ride (waiting for driver to accept)
    const today = new Date();
    const ride1 = await Ride.create({
      rider: testRider._id,
      pickupLocation: {
        address: 'Malabe Town, Kaduwela',
        lat: 6.9063,
        lng: 79.9726
      },
      dropLocation: {
        address: 'SLIIT Malabe Campus',
        lat: 6.9147,
        lng: 79.9728
      },
      scheduledDate: today,
      scheduledTime: '10:00 AM',
      passengers: 2,
      fare: 150,
      status: 'pending'
    });
    console.log('Created pending ride 1:', ride1._id);

    // Ride 2: Accepted ride (driver accepted, ready to start)
    const ride2 = await Ride.create({
      rider: testRider._id,
      driver: driverProfile._id,
      pickupLocation: {
        address: 'Kaduwela Junction',
        lat: 6.9271,
        lng: 79.9842
      },
      dropLocation: {
        address: 'SLIIT Metro Campus, Colombo',
        lat: 6.9271,
        lng: 79.8612
      },
      scheduledDate: today,
      scheduledTime: '11:00 AM',
      passengers: 1,
      fare: 300,
      status: 'accepted'
    });
    console.log('Created accepted ride 2:', ride2._id);

    // Ride 3: Ongoing ride (currently in progress)
    const ride3 = await Ride.create({
      rider: testRider._id,
      driver: driverProfile._id,
      pickupLocation: {
        address: 'Battaramulla Bus Stand',
        lat: 6.8989,
        lng: 79.9186
      },
      dropLocation: {
        address: 'SLIIT Malabe Campus',
        lat: 6.9147,
        lng: 79.9728
      },
      scheduledDate: today,
      scheduledTime: '09:00 AM',
      passengers: 3,
      fare: 200,
      status: 'ongoing',
      startedAt: new Date(Date.now() - 10 * 60 * 1000)
    });
    console.log('Created ongoing ride 3:', ride3._id);

    console.log('\n✅ Ride test data seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Rider: rider@test.com / test123');
    console.log('Driver: driver@test.com / test123');
    console.log('\nExpected Results:');
    console.log('- Driver Dashboard should show 1 pending ride request');
    console.log('- Driver can accept pending rides');
    console.log('- Driver has 1 accepted ride ready to start');
    console.log('- Driver has 1 ongoing ride with live map tracking');
    console.log('\nNote: Login as driver@test.com to test the driver dashboard with live map!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding ride data:', error);
    process.exit(1);
  }
}

seedRideData();
