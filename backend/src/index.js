require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectDatabases } = require('./config/database');

// Routes
const adminRoutes = require('./routes/admin');
const tokenRoutes = require('./routes/tokens');
const userRoutes = require('./routes/users');
const organisationRoutes = require('./routes/organisations');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 4001;

// Connect to both databases
connectDatabases().catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // For development, allow all localhost origins
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/tokens', tokenRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/organisations', organisationRoutes);
app.use('/api/admin/stats', statsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`qbit-ops backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
