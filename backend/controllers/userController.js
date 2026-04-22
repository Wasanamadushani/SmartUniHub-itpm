const User = require('../models/User');
const mongoose = require('mongoose');

const normalizeAnswer = (value = '') => value.trim().toLowerCase();
const normalizeEmail = (value = '') => value.trim().toLowerCase();
const normalizeText = (value = '') => value.trim();

const ensureDbConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database is unavailable. Please try again shortly.' });
    return false;
  }
  return true;
};

const sendUserError = (res, error) => {
  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];
    const labels = {
      email: 'email',
      studentId: 'student ID',
    };
    const fieldLabel = labels[duplicateField] || 'account details';
    return res.status(409).json({ message: `A user with that ${fieldLabel} already exists.` });
  }

  if (error?.name === 'ValidationError') {
    const firstValidationError = Object.values(error.errors || {})[0];
    return res.status(400).json({ message: firstValidationError?.message || 'Submitted data is invalid.' });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Submitted data is invalid.' });
  }

  console.error('User controller error:', error);
  return res.status(500).json({ message: 'Internal server error' });
};

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const {
      name,
      studentId,
      email,
      password,
      phone,
      role,
      securityQuestion,
      securityAnswer
    } = req.body;

    const normalizedName = normalizeText(name);
    const normalizedStudentId = normalizeText(studentId);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizeText(phone);
    const normalizedSecurityQuestion = normalizeText(securityQuestion);
    const normalizedSecurityAnswer = normalizeAnswer(securityAnswer);

    if (
      !normalizedName ||
      !normalizedStudentId ||
      !normalizedEmail ||
      !password ||
      !normalizedPhone ||
      !normalizedSecurityQuestion ||
      !normalizedSecurityAnswer
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({
      $or: [{ email: normalizedEmail }, { studentId: normalizedStudentId }]
    });
    if (userExists) {
      return res.status(409).json({ message: 'User with this email or student ID already exists' });
    }

    const user = await User.create({
      name: normalizedName,
      studentId: normalizedStudentId,
      email: normalizedEmail,
      password, // In production, hash this password
      phone: normalizedPhone,
      securityQuestion: normalizedSecurityQuestion,
      securityAnswer: normalizedSecurityAnswer,
      role: role || 'rider',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      studentId: user.studentId,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (error) {
    sendUserError(res, error);
  }
};

// @desc    Login user
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      studentId: user.studentId,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    });
  } catch (error) {
    sendUserError(res, error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
const getUserProfile = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    sendUserError(res, error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
const updateUserProfile = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, password: undefined }, // Don't allow password update here
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    sendUserError(res, error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const { role, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    sendUserError(res, error);
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    sendUserError(res, error);
  }
};

// @desc    Get security question for password reset
// @route   POST /api/users/forgot-password/security-question
const getForgotPasswordSecurityQuestion = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('securityQuestion');

    if (!user) {
      return res.status(404).json({ message: 'No account found for that email.' });
    }

    return res.status(200).json({
      message: 'Security question loaded. Please provide the correct answer to reset your password.',
      securityQuestion: user.securityQuestion,
    });
  } catch (error) {
    return sendUserError(res, error);
  }
};

// @desc    Reset password with security question
// @route   POST /api/users/forgot-password/security-reset
const resetPasswordWithSecurityQuestion = async (req, res) => {
  try {
    if (!ensureDbConnection(res)) return;

    const email = normalizeEmail(req.body?.email);
    const securityAnswer = req.body?.securityAnswer;
    const newPassword = req.body?.newPassword;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ message: 'Email, security answer, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found for that email.' });
    }

    const providedAnswer = normalizeAnswer(securityAnswer);
    if (providedAnswer !== normalizeAnswer(user.securityAnswer)) {
      return res.status(401).json({ message: 'Security answer is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    return sendUserError(res, error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  getForgotPasswordSecurityQuestion,
  resetPasswordWithSecurityQuestion,
};
