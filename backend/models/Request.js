const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    quantity: { type: Number, required: true, min: 1 },
    message: { type: String, default: "" },
    requesterMessage: { type: String, default: "" }, // Message about needing help
    status: {
      type: String,
      enum: ["pending", "helpers_applying", "pending_helper_acceptance", "assigned", "in_progress", "delivered", "cancelled"],
      default: "pending",
    },
    serviceCharge: { type: Number, default: 0, min: 0 }, // Charge by assigned helper
    canteen: { type: String, default: "" }, // Which canteen the order is from
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);