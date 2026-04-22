const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventStall = require('../models/EventStall');
const EventBooking = require('../models/EventBooking');
const mongoose = require('mongoose');

const VALID_EVENT_STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
const VALID_STALL_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_PAYMENT_STATUSES = ['pending_verification', 'approved', 'rejected'];

function generateTicketCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// Admin routes - Events
router.get('/events/pending', async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && VALID_EVENT_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching admin events:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/events/:id/approve', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(400).json({ message: error.message });
  }
});

router.post('/events/:id/reject', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(400).json({ message: error.message });
  }
});

router.patch('/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_EVENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Admin routes - Event stalls
router.get('/stalls', async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && VALID_STALL_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.eventId && mongoose.Types.ObjectId.isValid(req.query.eventId)) {
      filter.eventId = req.query.eventId;
    }

    const stalls = await EventStall.find(filter)
      .populate('eventId', 'title startDate endDate location status')
      .sort({ createdAt: -1 });

    res.json(stalls);
  } catch (error) {
    console.error('Error fetching admin stalls:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/stalls/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STALL_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const stall = await EventStall.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('eventId', 'title startDate endDate location status');

    if (!stall) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    res.json(stall);
  } catch (error) {
    console.error('Error updating stall status:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/stalls/:id', async (req, res) => {
  try {
    const deleted = await EventStall.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    res.json({ message: 'Stall deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin stall:', error);
    res.status(400).json({ message: error.message });
  }
});

// Admin routes - Event booking payment verification
router.get('/event-bookings', async (req, res) => {
  try {
    const filter = { status: 'booked' };
    const { paymentStatus } = req.query;

    if (paymentStatus && VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    const bookings = await EventBooking.find(filter)
      .populate('event', 'title location startDate endDate status')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching admin event bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/event-bookings/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus, note } = req.body;

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status value' });
    }

    const existingBooking = await EventBooking.findById(req.params.id);
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (paymentStatus === 'approved' && !existingBooking.paymentReceiptData) {
      return res.status(400).json({ message: 'Cannot approve payment before receipt upload' });
    }

    const update = {
      paymentStatus,
      adminVerificationNote: note ? String(note).trim() : undefined,
      verifiedAt: new Date(),
    };

    if (paymentStatus === 'approved') {
      update.ticketCode = generateTicketCode();
      update.ticketIssuedAt = new Date();
    }

    const booking = await EventBooking.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('event', 'title location startDate endDate status');

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking payment status:', error);
    res.status(400).json({ message: error.message });
  }
});

router.get('/db-health', async (_req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    res.json({
      mongoState: stateMap[state] || 'unknown',
      isConnected: state === 1,
      host: mongoose.connection.host || null,
      database: mongoose.connection.name || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;