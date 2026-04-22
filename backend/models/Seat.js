const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    tableId: {
      type: Number,
      required: true,
    },
    seatNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index({ tableId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
