const mongoose = require('mongoose');

const eventStallSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    stallName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'fundraising',
    },
    itemsSummary: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fundingGoal: {
      type: Number,
      min: 0,
      default: 0,
    },
    stallDate: {
      type: Date,
      default: null,
    },
    facultyName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
      default: '',
    },
    ownerContact: {
      type: String,
      trim: true,
      default: '',
    },
    requestedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EventStall', eventStallSchema);
