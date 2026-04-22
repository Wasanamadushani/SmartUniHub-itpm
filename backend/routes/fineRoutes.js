const express = require('express');
const router = express.Router();
const {
  getUnpaidFines,
  confirmPayment,
  getFinesByUser,
  getAllFines,
} = require('../controllers/fineController');

router.get('/', getAllFines);
router.get('/unpaid', getUnpaidFines);
router.put('/pay/:fineId', confirmPayment);
router.get('/user/:userId', getFinesByUser);

module.exports = router;
