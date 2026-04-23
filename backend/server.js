const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const rideRoutes = require('./routes/rideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const fineRoutes = require('./routes/fineRoutes');
const chatRoutes = require('./routes/chatRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const foodRoutes = require('./routes/foodRoutes');
const offerRoutes = require('./routes/offerRoutes');
const requestRoutes = require('./routes/requestRoutes');
const stallRoutes = require('./routes/stallRoutes');
const eventMemoryRoutes = require('./routes/eventMemoryRoutes');
const canteenRequestRoutes = require('./routes/canteenRequestRoutes');
const canteenUserRoutes = require('./routes/canteenUserRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const seatRoutes = require('./routes/seatRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('⚠️  Starting server without database connection');
  }
  
  // Routes
  app.use('/api/students', studentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/rides', rideRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api/event-memories', eventMemoryRoutes);
// Canteen module routes
app.use('/api/canteen/requests', canteenRequestRoutes);
app.use('/api/canteen/users', canteenUserRoutes);
app.use('/api/payments', paymentRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'SLIIT Student Transport API is running' });
});

// Socket.IO for real-time features
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('user-join', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined`);
  });

  // Join a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  // Send message
  socket.on('send-message', (data) => {
    const { chatId, message } = data;
    // Broadcast to all in the chat room except sender
    socket.to(chatId).emit('new-message', message);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(chatId).emit('user-typing', { userId, isTyping });
  });

  // Driver location update
  socket.on('update-location', (data) => {
    const { rideId, location } = data;
    // Broadcast to ride room
    io.to(`ride-${rideId}`).emit('driver-location', location);
  });

  // Join ride room for tracking
  socket.on('join-ride', (rideId) => {
    socket.join(`ride-${rideId}`);
    console.log(`Socket ${socket.id} joined ride tracking ${rideId}`);
  });

  // Ride status update
  socket.on('ride-status-update', (data) => {
    const { rideId, status } = data;
    io.to(`ride-${rideId}`).emit('ride-status-changed', { rideId, status });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO enabled`);
  });
}

// Start the server
startServer();


