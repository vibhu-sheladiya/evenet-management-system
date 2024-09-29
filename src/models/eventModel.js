const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    maxAttendees: { type: Number, required: true },
    attendees: [{ type: String }],
    image: {
        data: Buffer,
        contentType: String,
        fileName: String
    }
});

module.exports = mongoose.model('Event', eventSchema);
