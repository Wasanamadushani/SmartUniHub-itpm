const express = require('express');
const mongoose = require('mongoose');
const EventMemory = require('../models/EventMemory');
const Event = require('../models/Event');

const router = express.Router();
const EDIT_WINDOW_DAYS = 10;
const EDIT_WINDOW_MS = EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function resolveActingUserId(req) {
  const rawUserId = req.body?.actingUserId || req.query?.actingUserId || req.headers['x-user-id'];
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return null;
  }
  return String(rawUserId);
}

function getMemoryModificationViolation(memory, actingUserId) {
  if (!actingUserId) {
    return 'A valid user is required to modify this memory';
  }

  if (!memory.sharedByUserId || String(memory.sharedByUserId) !== String(actingUserId)) {
    return 'Only the original memory owner can modify this memory';
  }

  const createdAtTime = new Date(memory.createdAt).getTime();
  if (!Number.isFinite(createdAtTime)) {
    return 'Memory timestamp is invalid';
  }

  if (Date.now() - createdAtTime > EDIT_WINDOW_MS) {
    return `Memories can be updated or deleted only within ${EDIT_WINDOW_DAYS} days of sharing`;
  }

  return null;
}

router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = {};

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = eventId;
    }

    const memories = await EventMemory.find(filter)
      .populate('eventId', 'title startDate endDate location')
      .sort({ createdAt: -1 });

    res.json(memories);
  } catch (error) {
    console.error('Error fetching event memories:', error);
    res.status(500).json({ message: 'Unable to fetch event memories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { eventId, title, description, images, sharedByName, sharedByUserId } = req.body;

    if (!eventId || !sharedByName) {
      return res.status(400).json({ message: 'eventId and sharedByName are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid eventId' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!['approved', 'completed'].includes(event.status)) {
      return res.status(400).json({ message: 'Memories can be shared only for approved or completed events' });
    }

    const sanitizedImages = Array.isArray(images)
      ? images.filter((value) => typeof value === 'string' && value.trim().length > 0).slice(0, 6)
      : [];

    if (!String(title || '').trim() && !String(description || '').trim() && sanitizedImages.length === 0) {
      return res.status(400).json({ message: 'Add at least a title, description, or image to share memory' });
    }

    const memory = await EventMemory.create({
      eventId,
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      images: sanitizedImages,
      sharedByName: String(sharedByName || '').trim(),
      sharedByUserId: mongoose.Types.ObjectId.isValid(sharedByUserId) ? sharedByUserId : null,
    });

    const created = await EventMemory.findById(memory._id).populate('eventId', 'title startDate endDate location');
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating event memory:', error);
    res.status(400).json({ message: error.message || 'Unable to create event memory' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const actingUserId = resolveActingUserId(req);
    const memory = await EventMemory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    const violation = getMemoryModificationViolation(memory, actingUserId);
    if (violation) {
      return res.status(403).json({ message: violation });
    }

    const { title, description, images } = req.body;

    if (title !== undefined) {
      memory.title = String(title || '').trim();
    }

    if (description !== undefined) {
      memory.description = String(description || '').trim();
    }

    if (images !== undefined) {
      const sanitizedImages = Array.isArray(images)
        ? images.filter((value) => typeof value === 'string' && value.trim().length > 0).slice(0, 6)
        : [];
      memory.images = sanitizedImages;
    }

    if (!memory.title.trim() && !memory.description.trim() && (!memory.images || memory.images.length === 0)) {
      return res.status(400).json({ message: 'Add at least a title, description, or image to keep this memory' });
    }

    await memory.save();
    const updated = await EventMemory.findById(memory._id).populate('eventId', 'title startDate endDate location');
    res.json(updated);
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(400).json({ message: error.message || 'Unable to update memory' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const actingUserId = resolveActingUserId(req);
    const memory = await EventMemory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    const violation = getMemoryModificationViolation(memory, actingUserId);
    if (violation) {
      return res.status(403).json({ message: violation });
    }

    await EventMemory.deleteOne({ _id: req.params.id });

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(400).json({ message: error.message || 'Unable to delete memory' });
  }
});

module.exports = router;
