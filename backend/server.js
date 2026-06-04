const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const { initCronJobs } = require('./src/services/cronService');
const { errorHandler } = require('./src/middleware/errorMiddleware');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { generateCsrfToken, doubleCsrfProtection } = require('./src/middleware/csrfMiddleware');

// Load environment variables
dotenv.config(); // Load from current dir (backend)
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') }); // Load from root dir

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}
// Connect to Database
connectDB();

// Initialize Cron Schedulers
initCronJobs();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());

// Rate Limiting (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
}

// Middlewares
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));
// (Moved to top of middlewares)
// Body and Cookie Parsers
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Logging Middleware (Basic dev logging)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// CSRF Token endpoint — frontend calls this to get a token
app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// Apply CSRF protection to all state-changing API routes
app.use('/api/', doubleCsrfProtection);

// Mount Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/budgets', require('./src/routes/budgetRoutes'));
app.use('/api/goals', require('./src/routes/goalRoutes'));
app.use('/api/reminders', require('./src/routes/reminderRoutes'));
app.use('/api/insights', require('./src/routes/insightRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('Please set to production to serve frontend'));
}

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
