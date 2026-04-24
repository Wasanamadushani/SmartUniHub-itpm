const express = require('express');
const router = express.Router();
const {
  registerDriver,
  getDrivers,
  getDriverById,
  getDriverByUserId,
  updateDriver,
  updateAvailability,
  updateLocation,
  approveDriver,
  rejectDriver,
  deleteDriver,
  getDriverStats,
} = require('../controllers/driverController');

router.route('/').post(registerDriver).get(getDrivers);
router.get('/user/:userId', getDriverByUserId);
router.get('/:id/stats', getDriverStats);
router.patch('/:id/availability', updateAvailability);
router.patch('/:id/location', updateLocation);
router.patch('/:id/approve', approveDriver);
router.patch('/:id/reject', rejectDriver);
router.route('/:id').get(getDriverById).put(updateDriver).delete(deleteDriver);

module.exports = router;
