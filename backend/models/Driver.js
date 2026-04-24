const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['Sedan', 'Hatchback', 'SUV', 'Van', 'Motorbike', 'Tuk-Tuk'],
      default: 'Sedan',
    },
    vehicleNumber: {
      type: String,
      default: 'PENDING',
      trim: true,
    },
    vehicleModel: {
      type: String,
      default: 'To be updated',
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: 'PENDING',
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
      max: 15,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', driverSchema);
