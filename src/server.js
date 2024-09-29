const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');

require('dotenv').config();

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server); // Initialize Socket.io

connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Middleware to parse form-data and JSON
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data


app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
    createParentPath: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Socket.io setup
io.on('connection', (socket) => {
    console.log('A user connected');

    // Example of emitting an event
    socket.emit('notification', { message: 'Welcome to the Event Manager!' });

    // Handling disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
