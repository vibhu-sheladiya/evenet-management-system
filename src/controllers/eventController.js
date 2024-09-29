const path = require('path');
const fs = require('fs');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const { notifyUsers } = require('../utils/sendNotification');
const cron = require('node-cron');

// Create Event
const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, maxAttendees, attendees } = req.body;

        // Check if file was uploaded
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }

        // Access the file uploaded by the user
        let uploadedFile = req.files.image;

        // Define the upload path and file name
        const uploadPath = path.join(__dirname, '../uploads', uploadedFile.name);

        // Save the file to the 'uploads' folder
        uploadedFile.mv(uploadPath, async (err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to upload file.' });
            }

            // Convert attendees to an array if it's not already an array
            let attendeesArray = Array.isArray(attendees) ? attendees : attendees.split(',');

            // Save the event data along with the image file name to the database
            const event = await Event.create({
                title,
                description,
                date,
                location,
                maxAttendees,
                attendees: attendeesArray, // Store attendees as an array of strings
                image: {
                    fileName: uploadedFile.name, // Store the actual file name
                    contentType: uploadedFile.mimetype // Store the image's MIME type
                }
            });

            res.status(201).json(event);
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Events
const getEvents = async (req, res) => {
    try {
        const { date, location, title } = req.query;

        // Build a filter object based on the query parameters
        let filter = {};

        if (date) {
            // Assuming date is passed as 'YYYY-MM-DD' and filtering for events on or after this date
            filter.date = { $gte: new Date(date) };
        }

        if (location) {
            // Case-insensitive location matching
            filter.location = { $regex: new RegExp(location, 'i') };
        }

        if (title) {
            // Case-insensitive matching
            filter.title = { $regex: new RegExp(title, 'i') };
        }

        // Fetch the filtered events
        const events = await Event.find(filter).sort({ date: 1 });  // Sort by date (ascending)

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// RSVP for Event
const rsvpEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the user has already RSVP'd
        if (event.attendees.includes(req.user._id)) {
            return res.status(400).json({ message: 'You have already RSVP\'d for this event' });
        }

        // Check if the event is full
        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Add the user to the attendees list
        event.attendees.push(req.user._id);
        await event.save();

        res.status(200).json({ message: 'RSVP successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// View User's RSVP Status
const getUserRSVPs = async (req, res) => {
    try {
        // Find all events where the user is listed as an attendee
        const events = await Event.find({ attendees: req.user._id });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Edit Event
const editEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            event.title = req.body.title || event.title;
            event.description = req.body.description || event.description;
            event.date = req.body.date || event.date;
            event.location = req.body.location || event.location;

            const updatedEvent = await event.save();

            // Notify users of the event update
            await notifyUsers(updatedEvent);

            res.status(200).json(updatedEvent);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (event) {
            res.status(200).json({ message: 'Event removed successfully' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Schedule reminders for upcoming events
cron.schedule('0 8 * * *', async () => { // Every day at 8 AM
    const now = new Date();
    const reminderDate = new Date(now.setDate(now.getDate() + 1)); // 1 day before

    try {
        const events = await Event.find({ date: reminderDate });
        events.forEach(event => notifyUsers(event));
    } catch (error) {
        console.error('Error scheduling reminders:', error);
    }
});

module.exports = { createEvent, getEvents, rsvpEvent, getUserRSVPs, editEvent, deleteEvent };
