const User = require("../models/User");

// GET /api/canteen/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email itNumber phoneNumber serviceCharge isHelper role").sort({ createdAt: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/canteen/users/helpers/active
exports.getHelpers = async (req, res) => {
  try {
    const helpers = await User.find({ isHelper: true }).select("name email itNumber phoneNumber serviceCharge");
    res.json(helpers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/canteen/users/:id
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { itNumber, phoneNumber, isHelper, serviceCharge, name } = req.body || {};
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (typeof itNumber !== "undefined") user.itNumber = String(itNumber || "").trim();
    if (typeof phoneNumber !== "undefined") user.phoneNumber = String(phoneNumber || "").trim();
    if (typeof isHelper !== "undefined") user.isHelper = Boolean(isHelper);
    if (typeof serviceCharge !== "undefined") {
      const sc = Number(serviceCharge || 0);
      if (sc < 0) return res.status(400).json({ message: "Service charge cannot be negative" });
      user.serviceCharge = sc;
    }
    if (typeof name !== "undefined") user.name = String(name || "").trim();
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
