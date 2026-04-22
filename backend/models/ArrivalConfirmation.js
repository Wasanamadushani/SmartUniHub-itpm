const mongoose = require('mongoose');

const arrivalConfirmationSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    studentConfirmed: {
      type: Boolean,
      default: false,
    },
    studentConfirmedAt: {
      type: Date,
      default: null,
    },
    adminConfirmed: {
      type: Boolean,
      default: false,
    },
    adminConfirmedAt: {
      type: Date,
      default: null,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'no_show'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ArrivalConfirmation', arrivalConfirmationSchema);
