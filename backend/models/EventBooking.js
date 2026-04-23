const mongoose = require('mongoose');

const eventBookingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    bookingCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['booked', 'cancelled'],
      default: 'booked',
    },
    paymentStatus: {
      type: String,
      enum: ['pending_verification', 'approved', 'rejected'],
      default: 'pending_verification',
    },
    paymentMethod: {
      type: String,
      enum: ['card'],
      default: 'card',
    },
    paymentAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    cardHolderName: {
      type: String,
      trim: true,
    },
    cardLast4: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 4,
    },
    paymentReceiptData: {
      type: String,
    },
    paymentReceiptFileName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    paymentReceiptUploadedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    adminVerificationNote: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    ticketCode: {
      type: String,
      trim: true,
    },
    ticketIssuedAt: {
      type: Date,
    },
    tickets: [
      {
        ticketNumber: {
          type: String,
          required: true,
          trim: true,
        },
        seatNumber: {
          type: Number,
          required: true,
        },
        qrCode: {
          type: String,
          trim: true,
        },
        issuedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

eventBookingSchema.index({ event: 1, userId: 1, status: 1 });
eventBookingSchema.index({ paymentStatus: 1, createdAt: -1 });
eventBookingSchema.index({ paymentReference: 1 });

module.exports = mongoose.model('EventBooking', eventBookingSchema);
