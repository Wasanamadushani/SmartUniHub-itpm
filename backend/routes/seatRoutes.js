const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');

// Get all seats
router.get('/', seatController.getAllSeats);

// Add a seat (optional, for completion)
router.post('/', seatController.createSeat);

// Update a seat
router.put('/:id', seatController.updateSeat);

// Delete a seat
router.delete('/:id', seatController.deleteSeat);

module.exports = router;
