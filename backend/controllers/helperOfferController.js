const FoodRequest = require("../models/FoodRequest");
const HelperOffer = require("../models/HelperOffer");
const User = require("../models/User");

// POST /api/canteen/helper-offers
exports.submitOffer = async (req, res) => {
  try {
    const { requestId, helperId, serviceCharge, message } = req.body;
    if (!requestId || !helperId || serviceCharge === undefined) {
      return res.status(400).json({ message: "requestId, helperId, and serviceCharge are required" });
    }
    if (Number(serviceCharge) < 0) {
      return res.status(400).json({ message: "serviceCharge cannot be negative" });
    }
    if (message && String(message).length > 500) {
      return res.status(400).json({ message: "message cannot exceed 500 characters" });
    }
    const request = await FoodRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (String(request.requester) === String(helperId)) {
      return res.status(400).json({ message: "Requester cannot submit helper offer for own request" });
    }

    const helper = await User.findById(helperId);
    if (!helper || !helper.isHelper) {
      return res.status(403).json({ message: "Only active helper users can submit offers" });
    }

    if (request.status !== "OPEN") {
      return res.status(400).json({ message: "Only OPEN requests accept offers" });
    }
    const duplicate = await HelperOffer.findOne({ requestId, helperId });
    if (duplicate) return res.status(400).json({ message: "Offer already submitted" });
    const offer = await HelperOffer.create({ requestId, helperId, serviceCharge, message });
    res.status(201).json(offer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Offer already submitted" });
    }
    res.status(400).json({ message: error.message });
  }
};

// GET /api/canteen/helper-offers/:requestId
exports.getOffersByRequest = async (req, res) => {
  try {
    const offers = await HelperOffer.find({ requestId: req.params.requestId })
      .populate("helperId", "name email phoneNumber itNumber serviceCharge");
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
