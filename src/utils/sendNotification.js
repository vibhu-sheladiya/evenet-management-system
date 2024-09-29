const nodemailer = require('nodemailer');
const User = require('../models/userModel');

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS  // your email password
    }
});

// Send email notification
const sendNotification = async (userEmail, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Notification sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

// Notify users of event updates or approaching events
const notifyUsers = async (event) => {
    try {
        // Find all users who RSVP'd to the event
        const users = await User.find({ _id: { $in: event.attendees } });
        const user = await User.find({});

        users.forEach(user => {
            sendNotification(
                user.email,
                `Event Notification: ${event.title}`,
                `Dear ${user.username},\n\nThe event "${event.title}" has been updated. Here are the details:\n\nDescription: ${event.description}\nDate: ${event.date}\nLocation: ${event.location}\n\nBest regards,\nYour Event Management Team`
            );
        });
    } catch (error) {
        console.error('Error notifying users:', error);
    }
};

module.exports = { notifyUsers };
