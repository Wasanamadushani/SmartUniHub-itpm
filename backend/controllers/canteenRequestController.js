const FoodRequest = require("../models/FoodRequest");
const HelperOffer = require("../models/HelperOffer");
const User = require("../models/User");

const STATUS_FLOW = ["OPEN", "ASSIGNED", "PICKED", "DELIVERED", "COMPLETED"];
const REQUEST_LOCK_MESSAGE = "You already have an active request. Wait until helper confirms payment before creating a new food request.";

const isValidNextStatus = (current, next) => {
  const currentIndex = STATUS_FLOW.indexOf(current);
  const nextIndex = STATUS_FLOW.indexOf(next);
  return nextIndex === currentIndex + 1;
};

const isRequestBlockingForNewCreate = (request) => {
  if (!request) return false;

  const status = String(request.status || "").toUpperCase();
  const paymentStatus = String(request.paymentStatus || "").toUpperCase();
  const hasPaymentRecord = Boolean(request.paymentId);

  if (["OPEN", "ASSIGNED", "PICKED", "DELIVERED"].includes(status)) return true;
  if (status === "COMPLETED" && hasPaymentRecord && paymentStatus !== "COMPLETED") return true;

  return false;
};

// POST /api/canteen/requests
exports.createRequest = async (req, res) => {
  try {
    const { requesterId, foodItem, quantity, note, canteen } = req.body;
    if (!requesterId || !foodItem || !quantity) {
      return res.status(400).json({ message: "requesterId, foodItem, and quantity are required" });
    }

    const latestRequest = await FoodRequest.findOne({ requester: requesterId })
      .sort({ createdAt: -1 })
      .select("_id status paymentStatus paymentId createdAt");

    if (isRequestBlockingForNewCreate(latestRequest)) {
      return res.status(409).json({
        message: REQUEST_LOCK_MESSAGE,
      });
    }

    const request = await FoodRequest.create({
      requester: requesterId,
      foodItem,
      quantity,
      note: note || "",
      canteen: canteen || "",
      status: "OPEN",
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/canteen/requests
exports.getOpenRequests = async (req, res) => {
  try {
    const filter = { status: "OPEN" };
    if (req.query.canteen) filter.canteen = req.query.canteen;
    const requests = await FoodRequest.find(filter).populate("requester", "name");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/canteen/requests/my/:userId
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await FoodRequest.find({ requester: req.params.userId })
      .populate("selectedHelper", "name email phoneNumber itNumber serviceCharge");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/canteen/requests/helper/:userId
exports.getHelperRequests = async (req, res) => {
  try {
    const requests = await FoodRequest.find({
      selectedHelper: req.params.userId,
      status: { $in: ["ASSIGNED", "PICKED", "DELIVERED"] },
    })
      .populate("requester", "name")
      .populate("selectedHelper", "name email phoneNumber itNumber serviceCharge");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/canteen/requests/:id
exports.getRequestDetails = async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id)
      .populate("requester", "name")
      .populate("selectedHelper", "name phoneNumber itNumber serviceCharge");
    if (!request) return res.status(404).json({ message: "Request not found" });
    const offers = await HelperOffer.find({ requestId: req.params.id })
      .populate("helperId", "name phoneNumber itNumber serviceCharge");
    res.json({ request, offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/canteen/requests/:id/assign
exports.assignHelper = async (req, res) => {
  try {
    const { requesterId, helperId } = req.body;
    if (!requesterId || !helperId) {
      return res.status(400).json({ message: "requesterId and helperId are required" });
    }
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.requester) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the requester can assign a helper" });
    }
    if (request.status !== "OPEN") {
      return res.status(400).json({ message: "Only OPEN requests can be assigned" });
    }

    const selectedOffer = await HelperOffer.findOne({ requestId: req.params.id, helperId });
    if (!selectedOffer) {
      return res.status(400).json({ message: "Helper must submit an offer before being selected" });
    }

    const helper = await User.findById(helperId);
    if (!helper || !helper.isHelper) {
      return res.status(403).json({ message: "Selected user is not an active helper" });
    }

    request.selectedHelper = helperId;
    request.selectedServiceCharge = Number(selectedOffer.serviceCharge || helper.serviceCharge || 0);
    request.helperAccepted = false;
    request.helperAcceptedAt = null;
    request.status = "ASSIGNED";
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/canteen/requests/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, helperId, requesterId } = req.body;
    if (!status || !STATUS_FLOW.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (!isValidNextStatus(request.status, status)) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    if (status === "PICKED") {
      if (!helperId || String(request.selectedHelper) !== String(helperId)) {
        return res.status(403).json({ message: "Only the selected helper can mark PICKED" });
      }
      if (!request.helperAccepted) {
        return res.status(400).json({ message: "Helper must confirm acceptance before marking PICKED" });
      }
    }

    if (status === "DELIVERED") {
      if (!requesterId || String(request.requester) !== String(requesterId)) {
        return res.status(403).json({ message: "Only the requester can mark DELIVERED" });
      }
      request.deliveredConfirmedByRequesterAt = new Date();
    }

    if (status === "COMPLETED") {
      if (!helperId || String(request.selectedHelper) !== String(helperId)) {
        return res.status(403).json({ message: "Only the selected helper can mark COMPLETED" });
      }
      request.completedMarkedByHelperAt = new Date();
    }

    request.status = status;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/canteen/requests/:id
exports.updateRequestByRequester = async (req, res) => {
  try {
    const { requesterId, foodItem, quantity, note } = req.body;
    if (!requesterId) return res.status(400).json({ message: "requesterId is required" });
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.requester) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the requester can edit this request" });
    }
    if (request.status !== "OPEN") {
      return res.status(400).json({ message: "Only OPEN requests can be edited" });
    }
    if (foodItem) request.foodItem = String(foodItem).trim();
    if (quantity !== undefined) {
      const nextQty = Number(quantity);
      if (!Number.isFinite(nextQty) || nextQty < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      request.quantity = nextQty;
    }
    if (note !== undefined) request.note = String(note).trim();
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/canteen/requests/:id/cancel
exports.cancelRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId) return res.status(400).json({ message: "requesterId is required" });
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.requester) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the requester can cancel this request" });
    }
    if (request.status !== "OPEN") {
      return res.status(400).json({ message: "Only OPEN requests can be cancelled" });
    }
    request.status = "CANCELLED";
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/canteen/requests/:id
exports.deleteRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId) return res.status(400).json({ message: "requesterId is required" });

    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (String(request.requester) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the requester can delete this request" });
    }

    if (!["COMPLETED", "CANCELLED"].includes(request.status)) {
      return res.status(400).json({ message: "Only old requests (COMPLETED or CANCELLED) can be deleted" });
    }

    await HelperOffer.deleteMany({ requestId: request._id });
    await request.deleteOne();

    return res.json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// PUT /api/canteen/requests/:id/accept
exports.acceptRequestByHelper = async (req, res) => {
  try {
    const { helperId } = req.body;
    if (!helperId) return res.status(400).json({ message: "helperId is required" });
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "ASSIGNED") {
      return res.status(400).json({ message: "Only ASSIGNED requests can be confirmed by helper" });
    }

    if (!request.selectedHelper || String(request.selectedHelper) !== String(helperId)) {
      return res.status(403).json({ message: "Only the selected helper can confirm this request" });
    }

    const helper = await User.findById(helperId);
    if (!helper || !helper.isHelper) {
      return res.status(403).json({ message: "Only helper users can accept requests" });
    }

    request.helperAccepted = true;
    request.helperAcceptedAt = new Date();

    if (!request.selectedServiceCharge || request.selectedServiceCharge < 0) {
      request.selectedServiceCharge = Number(helper.serviceCharge || 0);
    }

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/canteen/requests/:id/track
exports.updateTracking = async (req, res) => {
  try {
    const { helperId, location, note, lat, lng } = req.body;
    if (!helperId || !location) {
      return res.status(400).json({ message: "helperId and location are required" });
    }
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.selectedHelper) !== String(helperId)) {
      return res.status(403).json({ message: "Only the selected helper can update tracking" });
    }

    if (!request.helperAccepted) {
      return res.status(400).json({ message: "Helper must confirm request before sharing tracking" });
    }

    if (!["PICKED", "DELIVERED"].includes(request.status)) {
      return res.status(400).json({ message: "Tracking is available after PICKED and before COMPLETED" });
    }
    const parsedLat = lat === undefined || lat === null || lat === "" ? null : Number(lat);
    const parsedLng = lng === undefined || lng === null || lng === "" ? null : Number(lng);
    const hasCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
    const entry = {
      location: String(location).trim(),
      note: note ? String(note).trim() : "",
      status: request.status,
      lat: hasCoords ? parsedLat : null,
      lng: hasCoords ? parsedLng : null,
      at: new Date(),
    };
    if (!request.tracking) request.tracking = { history: [] };
    request.tracking.lastLocation = entry.location;
    request.tracking.lastNote = entry.note;
    request.tracking.lastLat = entry.lat;
    request.tracking.lastLng = entry.lng;
    request.tracking.updatedAt = entry.at;
    request.tracking.history = request.tracking.history || [];
    request.tracking.history.push(entry);
    await request.save();
    res.json(request.tracking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
