const mongoose = require("mongoose");

const helperOfferSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodRequest",
      required: true,
    },
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Prevent duplicate offers from same helper on same request
helperOfferSchema.index({ requestId: 1, helperId: 1 }, { unique: true });

module.exports = mongoose.model("HelperOffer", helperOfferSchema);
