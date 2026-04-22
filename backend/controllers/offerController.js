const Offer = require("../models/Offer");

// GET /api/offers?canteen=xxx
const getOffers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.canteen) filter.canteen = req.query.canteen;
    // Only return active offers for public endpoint
    filter.isActive = true;
    const offers = await Offer.find(filter).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/offers/admin?canteen=xxx (all offers including inactive, for admin)
const getAllOffers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.canteen) filter.canteen = req.query.canteen;
    const offers = await Offer.find(filter).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/offers
const createOffer = async (req, res) => {
  try {
    const { title, discount, description, icon, startTime, endTime, badge, isActive, canteen } = req.body;
    if (!title || !discount || !description || !startTime || !endTime || !canteen) {
      return res.status(400).json({ message: "title, discount, description, startTime, endTime, and canteen are required" });
    }
    if (!["anohana", "basement"].includes(canteen)) {
      return res.status(400).json({ message: "Invalid canteen. Must be 'anohana' or 'basement'" });
    }
    const offer = await Offer.create({
      title, discount, description,
      icon: icon || "🎁",
      startTime, endTime,
      badge: badge || "OFFER",
      isActive: isActive !== undefined ? isActive : true,
      canteen,
    });
    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/offers/:id
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.canteen && !["anohana", "basement"].includes(updates.canteen)) {
      return res.status(400).json({ message: "Invalid canteen" });
    }
    const offer = await Offer.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/offers/:id
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOffers, getAllOffers, createOffer, updateOffer, deleteOffer };
