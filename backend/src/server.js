require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/db');
const GroupMessageModel = require('./models/groupMessageModel');
const TripMemberModel = require('./models/tripMemberModel');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const journalRoutes = require('./routes/journalRoutes');
const chatRoutes = require('./routes/chatRoutes');
const activityRoutes = require('./routes/activityRoutes');
const routeRoutes = require('./routes/routeRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const emergencyContactRoutes = require('./routes/emergencyContactRoutes');
const tripMemberRoutes = require('./routes/tripMemberRoutes');
const packingRoutes = require('./routes/packingRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const groupChatRoutes = require('./routes/groupChatRoutes');

const app = express();

// ---- Global middleware ----
app.use(helmet());

// Accept the configured CLIENT_URL plus the common Vite dev ports, so
// registration/login don't silently fail just because Vite picked a
// different port (e.g. 5174) when 5173 was already in use.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TravelPilot API is running', timestamp: new Date().toISOString() });
});

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/trips/:tripId/members', tripMemberRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/group-chat', groupChatRoutes);

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

// ---- Real-time group trip chat ----
// One Socket.io room per trip ("trip:<id>"). Uses the same JWT as the REST
// API for auth, passed in the socket handshake instead of a header.
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_trip', async (tripId) => {
    try {
      // Only let someone into a trip's chat room if they're actually a
      // member of that trip — mirrors the REST history endpoint's check.
      const member = await TripMemberModel.findByTripAndUser(tripId, socket.user.id);
      if (!member || member.status !== 'joined') return;
      socket.join(`trip:${tripId}`);
    } catch (err) {
      console.error('join_trip failed:', err.message);
    }
  });

  socket.on('leave_trip', (tripId) => {
    socket.leave(`trip:${tripId}`);
  });

  socket.on('send_message', async ({ tripId, message, photoUrl }) => {
    const text = (message || '').trim();
    if (!tripId || (!text && !photoUrl)) return;
    try {
      const member = await TripMemberModel.findByTripAndUser(tripId, socket.user.id);
      if (!member || member.status !== 'joined') return;
      const id = await GroupMessageModel.create({ tripId, userId: socket.user.id, message: text, photoUrl });
      io.to(`trip:${tripId}`).emit('new_message', {
        id,
        trip_id: tripId,
        user_id: socket.user.id,
        sender_name: socket.user.name,
        message: text,
        photo_url: photoUrl || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('send_message failed:', err.message);
    }
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 TravelPilot API running on http://localhost:${PORT}`);
  console.log(`💬 Group chat socket server ready`);
  await testConnection();
});
