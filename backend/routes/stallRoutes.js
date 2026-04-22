const express = require('express');
const mongoose = require('mongoose');
const EventStall = require('../models/EventStall');
const Event = require('../models/Event');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { eventId, status, includeAll } = req.query;
    const filter = {};

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = eventId;
    }

    if (status) {
      filter.status = status;
    } else if (includeAll !== 'true') {
      filter.status = 'approved';
    }

    const stalls = await EventStall.find(filter)
      .populate('eventId', 'title startDate endDate location status')
      .sort({ createdAt: -1 });

    res.json(stalls);
  } catch (error) {
    console.error('Error fetching stalls:', error);
    res.status(500).json({ message: 'Unable to fetch stalls' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      eventId,
      stallName,
      category,
      itemsSummary,
      description,
      fundingGoal,
      stallDate,
      facultyName,
      ownerName,
      ownerContact,
      requestedByUserId,
      image,
    } = req.body;

    const resolvedFacultyName = String(facultyName || ownerName || '').trim();

    if (!eventId || !stallName || !resolvedFacultyName) {
      return res.status(400).json({ message: 'eventId, stallName, and facultyName are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid eventId' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const parsedStallDate = stallDate ? new Date(stallDate) : null;
    if (parsedStallDate && Number.isNaN(parsedStallDate.getTime())) {
      return res.status(400).json({ message: 'Invalid stall date' });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Stalls can be requested only for approved events' });
    }

    const stall = await EventStall.create({
      eventId,
      stallName,
      category,
      itemsSummary,
      description,
      fundingGoal: Number(fundingGoal || 0),
      stallDate: parsedStallDate,
      facultyName: resolvedFacultyName,
      ownerName: resolvedFacultyName,
      ownerContact: String(ownerContact || '').trim(),
      requestedByUserId: mongoose.Types.ObjectId.isValid(requestedByUserId) ? requestedByUserId : null,
      image: String(image || ''),
      status: 'pending',
    });

    const created = await EventStall.findById(stall._id).populate('eventId', 'title startDate endDate location status');
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating stall request:', error);
    res.status(400).json({ message: error.message || 'Unable to create stall request' });
  }
});

module.exports = router;
