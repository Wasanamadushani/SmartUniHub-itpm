const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodItem: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    canteen: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["OPEN", "ASSIGNED", "PICKED", "DELIVERED", "COMPLETED", "CANCELLED"],
      default: "OPEN",
    },
    selectedHelper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    selectedServiceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    helperAccepted: {
      type: Boolean,
      default: false,
    },
    helperAcceptedAt: {
      type: Date,
      default: null,
    },
    deliveredConfirmedByRequesterAt: {
      type: Date,
      default: null,
    },
    completedMarkedByHelperAt: {
      type: Date,
      default: null,
    },
    tracking: {
      lastLocation: { type: String, trim: true, default: "" },
      lastNote: { type: String, trim: true, default: "" },
      lastLat: { type: Number, default: null },
      lastLng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
      history: [
        {
          location: { type: String, trim: true, required: true },
          note: { type: String, trim: true, default: "" },
          status: { type: String, trim: true, default: "" },
          lat: { type: Number, default: null },
          lng: { type: Number, default: null },
          at: { type: Date, default: Date.now },
        },
      ],
    },
    // Payment - Cash on Delivery
    itemPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH"],
      default: "CASH",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodRequest", foodRequestSchema);
