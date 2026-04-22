const Fine = require('../models/Fine');
const User = require('../models/User');

const getUnpaidFines = async (req, res) => {
  try {
    const fines = await Fine.find({ status: 'unpaid' })
      .populate('user', 'name email')
      .populate('booking')
      .sort({ createdAt: -1 });

    const results = fines.map((fine) => ({
      fine_id: fine._id,
      student_name: fine.user.name,
      student_email: fine.user.email,
      amount: fine.amount,
      reason: fine.reason,
      status: fine.status,
      created_at: fine.createdAt,
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.fineId);
    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    fine.status = 'paid';
    fine.paidAt = new Date();
    await fine.save();

    res.status(200).json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFinesByUser = async (req, res) => {
  try {
    const fines = await Fine.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(fines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllFines = async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate('user', 'name email')
      .populate('booking')
      .sort({ createdAt: -1 });
    res.status(200).json(fines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUnpaidFines,
  confirmPayment,
  getFinesByUser,
  getAllFines,
};
