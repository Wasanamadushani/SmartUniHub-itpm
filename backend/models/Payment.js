const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    foodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodRequest",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    helper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH"],
      default: "CASH",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    itemDetails: {
      itemName: { type: String, trim: true, default: "" },
      quantity: { type: Number, default: 1 },
      itemPrice: { type: Number, default: 0 },
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
