
const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Middleware to protect routes
const { createEvent, getEvents, rsvpEvent, getUserRSVPs, editEvent, deleteEvent } = require('../controllers/eventController');

const router = express.Router();

router.post('/', createEvent);
router.get('/', getEvents);
router.put('/:id/rsvp', protect, rsvpEvent);
router.get('/my-rsvps', protect, getUserRSVPs);
router.put('/:id', protect, editEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
