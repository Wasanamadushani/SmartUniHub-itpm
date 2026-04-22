const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getForgotPasswordSecurityQuestion,
  resetPasswordWithSecurityQuestion,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
} = require('../controllers/userController');
const { getHelpers } = require('../controllers/canteenUserController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password/security-question', getForgotPasswordSecurityQuestion);
router.post('/forgot-password/security-reset', resetPasswordWithSecurityQuestion);
// Canteen: get active helpers (must be before /:id)
router.get('/helpers/active', getHelpers);
router.route('/').get(getAllUsers);
router.route('/:id').get(getUserProfile).put(updateUserProfile).delete(deleteUser);

module.exports = router;
