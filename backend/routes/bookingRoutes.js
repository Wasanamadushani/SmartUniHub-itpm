const express = require('express');
const router = express.Router();
const {
  getSeats,
  createBooking,
  getActiveBookingByUser,
  completeBooking,
  cancelBooking,
  markArrival,
  getPendingArrivals,
  confirmArrivalByAdmin,
  markNoShowByAdmin,
  getAllBookings,
} = require('../controllers/bookingController');

router.get('/', getAllBookings);
router.get('/seats', getSeats);
router.post('/', createBooking);
router.get('/active/:userId', getActiveBookingByUser);
router.put('/complete/:bookingId', completeBooking);
router.put('/cancel/:bookingId', cancelBooking);
router.put('/arrive/:bookingId', markArrival);
router.get('/pending-arrivals', getPendingArrivals);
router.put('/admin-confirm/:bookingId', confirmArrivalByAdmin);
router.put('/admin-no-show/:bookingId', markNoShowByAdmin);

module.exports = router;
