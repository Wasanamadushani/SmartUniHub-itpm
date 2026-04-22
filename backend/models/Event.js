const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    trim: true,
  },
  eventType: {
    type: String,
    enum: ['indoor', 'outdoor'],
    default: 'indoor',
  },
  totalSeats: {
    type: Number,
    min: 1,
  },
  ticketPrice: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

eventSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Event', eventSchema);
