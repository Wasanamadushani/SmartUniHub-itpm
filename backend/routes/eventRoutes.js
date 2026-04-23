const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const EventBooking = require('../models/EventBooking');

const router = express.Router();
const MAX_SEATS_PER_BOOKING = 5;
const MIN_EXPIRY_YEAR_SHORT = 26;
const MAX_EXPIRY_YEAR_SHORT = MIN_EXPIRY_YEAR_SHORT + 5;

function generatePaymentReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
}

function generateTicketCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

function isValidReceiptDataUrl(value) {
  const dataUrl = String(value || '').trim();
  return /^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,[A-Za-z0-9+/=\r\n]+$/i.test(dataUrl);
}

// Get bookings/tickets for a user
router.get('/bookings/my', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'A valid user id is required' });
    }

    const bookings = await EventBooking.find({
      userId,
      status: 'booked',
    })
      .populate('event', 'title location startDate endDate eventType status ticketPrice')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user event bookings:', error);
    res.status(500).json({ message: 'Unable to fetch user bookings' });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const { status, includeAll } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else if (includeAll !== 'true') {
      filter.status = 'approved';
    }

    const events = await Event.find(filter).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Unable to fetch events' });
  }
});

// Get a specific event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Unable to fetch event' });
  }
});

// Get booking summary for an event
router.get('/:id/bookings/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const bookedAggregation = await EventBooking.aggregate([
      {
        $match: {
          event: event._id,
          status: 'booked',
        },
      },
      {
        $group: {
          _id: null,
          totalBooked: { $sum: '$bookingCount' },
        },
      },
    ]);

    const bookedSeats = bookedAggregation[0]?.totalBooked || 0;
    const totalSeats = Number.isFinite(event.totalSeats) ? event.totalSeats : 0;
    const remainingSeats = Math.max(totalSeats - bookedSeats, 0);
    const isBookable = event.status === 'approved' && event.eventType === 'indoor' && totalSeats > 0;

    let userHasBooked = false;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const existingBooking = await EventBooking.findOne({
        event: event._id,
        userId,
        status: 'booked',
      }).select('_id');
      userHasBooked = Boolean(existingBooking);
    }

    res.json({
      eventId: event._id,
      eventStatus: event.status,
      eventType: event.eventType,
      ticketPrice: Number.isFinite(event.ticketPrice) ? event.ticketPrice : null,
      totalSeats,
      bookedSeats,
      remainingSeats,
      isBookable,
      userHasBooked,
    });
  } catch (error) {
    console.error('Error fetching booking summary:', error);
    res.status(500).json({ message: 'Unable to fetch booking summary' });
  }
});

// Get a single event booking detail
router.get('/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await EventBooking.findById(bookingId)
      .populate('event', 'title ticketPrice location startDate endDate')
      .populate('userId', 'email')
      .lean();

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      _id: booking._id,
      userId: booking.userId,
      event: booking.event,
      bookingCount: booking.bookingCount,
      paymentStatus: booking.paymentStatus,
      paymentReceiptFileName: booking.paymentReceiptFileName,
      paymentReceiptUploadedAt: booking.paymentReceiptUploadedAt,
      verifiedAt: booking.verifiedAt,
      tickets: booking.tickets || [],
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching booking detail:', error);
    res.status(500).json({ message: 'Unable to fetch booking details' });
  }
});

// Upload payment receipt for an event booking
router.post('/bookings/:bookingId/receipt', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId, receiptDataUrl, fileName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'A valid user id is required' });
    }

    if (!isValidReceiptDataUrl(receiptDataUrl)) {
      return res.status(400).json({ message: 'A valid receipt file is required (png, jpg, jpeg, webp, pdf)' });
    }

    if (String(receiptDataUrl).length > 8_000_000) {
      return res.status(400).json({ message: 'Receipt image is too large' });
    }

    const booking = await EventBooking.findOne({ _id: bookingId, userId, status: 'booked' });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.paymentReceiptData = String(receiptDataUrl).trim();
    booking.paymentReceiptFileName = fileName ? String(fileName).trim().slice(0, 120) : undefined;
    booking.paymentReceiptUploadedAt = new Date();
    booking.paymentStatus = 'pending_verification';

    await booking.save();

    res.json({
      message: 'Receipt uploaded successfully. Waiting for admin verification.',
      booking,
    });
  } catch (error) {
    console.error('Error uploading booking receipt:', error);
    res.status(400).json({ message: error.message || 'Unable to upload receipt' });
  }
});

// Create a new event
router.post('/', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      status: 'pending',
    };

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
    const now = new Date();

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'startDate and endDate must be valid date values' });
    }

    if (startDate < now) {
      return res.status(400).json({ message: 'startDate cannot be in the past' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ message: 'endDate must be later than startDate' });
    }

    // Check for overlapping events
    const overlappingEvents = await Event.findOne({
      $and: [
        { startDate: { $lt: endDate } },
        { endDate: { $gt: startDate } },
      ],
    });

    if (overlappingEvents) {
      return res.status(400).json({
        message: 'Cannot create event: there is already an event scheduled during this time slot. Please choose a different date/time range.',
        conflictingEvent: {
          id: overlappingEvents._id,
          title: overlappingEvents.title,
          startDate: overlappingEvents.startDate,
          endDate: overlappingEvents.endDate,
        },
      });
    }

    const isIndoorEvent = payload.eventType === 'indoor';

    if (!isIndoorEvent) {
      payload.totalSeats = undefined;
      payload.ticketPrice = undefined;
    } else {
      if (payload.totalSeats !== undefined && payload.totalSeats !== null && payload.totalSeats !== '') {
        const totalSeats = Number(payload.totalSeats);
        if (!Number.isInteger(totalSeats) || totalSeats < 1) {
          return res.status(400).json({ message: 'totalSeats must be a positive integer for indoor events' });
        }
        payload.totalSeats = totalSeats;
      }

      if (payload.ticketPrice === undefined || payload.ticketPrice === null || payload.ticketPrice === '') {
        return res.status(400).json({ message: 'ticketPrice is required for indoor events' });
      }

      const ticketPrice = Number(payload.ticketPrice);
      if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
        return res.status(400).json({ message: 'ticketPrice must be a non-negative number for indoor events' });
      }
      payload.ticketPrice = ticketPrice;
    }

    const event = new Event(payload);
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Create a booking for an approved indoor event
router.post('/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, userEmail, bookingCount, note, payment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'A valid user id is required' });
    }

    if (!String(userName || '').trim()) {
      return res.status(400).json({ message: 'User name is required for booking' });
    }

    const seatsToBook = Number(bookingCount || 1);
    if (!Number.isInteger(seatsToBook) || seatsToBook < 1) {
      return res.status(400).json({ message: 'bookingCount must be a positive integer' });
    }

    if (seatsToBook > MAX_SEATS_PER_BOOKING) {
      return res.status(400).json({
        message: `You can book a maximum of ${MAX_SEATS_PER_BOOKING} seat(s) at once`,
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved events can be booked' });
    }

    if (event.eventType !== 'indoor') {
      return res.status(400).json({ message: 'Only indoor events can be booked' });
    }

    if (!Number.isFinite(event.totalSeats) || event.totalSeats < 1) {
      return res.status(400).json({ message: 'This event does not have valid seat capacity' });
    }

    const existingBooking = await EventBooking.findOne({
      event: event._id,
      userId,
      status: 'booked',
    }).select('_id');

    if (existingBooking) {
      return res.status(409).json({ message: 'You already booked this event' });
    }

    const bookedAggregation = await EventBooking.aggregate([
      {
        $match: {
          event: event._id,
          status: 'booked',
        },
      },
      {
        $group: {
          _id: null,
          totalBooked: { $sum: '$bookingCount' },
        },
      },
    ]);

    const bookedSeats = bookedAggregation[0]?.totalBooked || 0;
    const remainingSeats = Math.max(event.totalSeats - bookedSeats, 0);

    if (seatsToBook > remainingSeats) {
      return res.status(400).json({
        message: `Only ${remainingSeats} seat(s) remaining for this event`,
      });
    }

    const unitTicketPrice = Number(event.ticketPrice);
    if (!Number.isFinite(unitTicketPrice) || unitTicketPrice < 0) {
      return res.status(400).json({ message: 'Ticket price is not configured for this event' });
    }
    const paymentAmount = Number((unitTicketPrice * seatsToBook).toFixed(2));

    const paymentPayload = payment || {};
    const cardHolderName = String(paymentPayload.cardHolderName || '').trim();
    const cardNumber = String(paymentPayload.cardNumber || '').replace(/\s+/g, '');
    const expiry = String(paymentPayload.expiry || '').trim();
    const cvv = String(paymentPayload.cvv || '').trim();

    const cardNumberValid = /^\d{16}$/.test(cardNumber);
    const cardHolderValid = /^[A-Za-z ]{3,80}$/.test(cardHolderName);
    const expiryValid = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry);
    const cvvValid = /^\d{3}$/.test(cvv);

    if (!cardHolderValid || !cardNumberValid || !expiryValid || !cvvValid) {
      return res.status(400).json({
        message: 'Valid payment details are required (name, 16-digit card, MM/YY expiry, 3-digit CVV)',
      });
    }

    const [expiryMonth, expiryYearShort] = expiry.split('/').map(Number);
    if (expiryYearShort < MIN_EXPIRY_YEAR_SHORT || expiryYearShort > MAX_EXPIRY_YEAR_SHORT) {
      return res.status(400).json({
        message: `Expiry year must be between ${MIN_EXPIRY_YEAR_SHORT} and ${MAX_EXPIRY_YEAR_SHORT}`,
      });
    }

    const expiryYear = 2000 + expiryYearShort;
    const expiryDate = new Date(expiryYear, expiryMonth, 0, 23, 59, 59, 999);
    if (expiryDate < new Date()) {
      return res.status(400).json({ message: 'Card expiry date is in the past' });
    }

    const cardLast4 = cardNumber.slice(-4);
    const paymentReference = generatePaymentReference();

    const booking = await EventBooking.create({
      event: event._id,
      userId,
      userName: String(userName).trim(),
      userEmail: userEmail ? String(userEmail).trim().toLowerCase() : undefined,
      bookingCount: seatsToBook,
      note: note ? String(note).trim() : undefined,
      status: 'booked',
      paymentStatus: 'pending_verification',
      paymentMethod: 'card',
      paymentAmount,
      paymentReference,
      cardHolderName,
      cardLast4,
    });

    res.status(201).json({
      message: 'Payment submitted. Waiting for admin verification.',
      booking,
      bookingSummary: {
        totalSeats: event.totalSeats,
        bookedSeats: bookedSeats + seatsToBook,
        remainingSeats: remainingSeats - seatsToBook,
      },
    });
  } catch (error) {
    console.error('Error creating event booking:', error);
    res.status(400).json({ message: error.message || 'Unable to book event' });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const payload = {
      ...req.body,
    };

    const nextEventType = payload.eventType || existingEvent.eventType;
    const isIndoorEvent = nextEventType === 'indoor';

    if (!isIndoorEvent) {
      payload.totalSeats = undefined;
      payload.ticketPrice = undefined;
    } else {
      if (payload.totalSeats !== undefined && payload.totalSeats !== null && payload.totalSeats !== '') {
        const totalSeats = Number(payload.totalSeats);
        if (!Number.isInteger(totalSeats) || totalSeats < 1) {
          return res.status(400).json({ message: 'totalSeats must be a positive integer for indoor events' });
        }
        payload.totalSeats = totalSeats;
      }

      if (payload.ticketPrice !== undefined && payload.ticketPrice !== null && payload.ticketPrice !== '') {
        const ticketPrice = Number(payload.ticketPrice);
        if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
          return res.status(400).json({ message: 'ticketPrice must be a non-negative number for indoor events' });
        }
        payload.ticketPrice = ticketPrice;
      }

      const resultingTicketPrice = payload.ticketPrice !== undefined
        ? payload.ticketPrice
        : existingEvent.ticketPrice;

      if (!Number.isFinite(Number(resultingTicketPrice)) || Number(resultingTicketPrice) < 0) {
        return res.status(400).json({ message: 'ticketPrice is required for indoor events' });
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Unable to delete event' });
  }
});

module.exports = router;
