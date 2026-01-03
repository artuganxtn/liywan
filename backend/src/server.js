import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import { initSentry } from './utils/sentry.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import { notFound } from './middleware/notFound.js';
import { performanceMonitor } from './utils/performance.js';
import { cacheHeaders } from './middleware/cacheHeaders.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Validate required environment variables
const requiredEnvVars = ['DB_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  initSentry();
}

// Handle unhandled promise rejections (set up early to catch DB connection errors)
let serverRef = null;
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  if (serverRef && serverRef.listening) {
    serverRef.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Connect to database
connectDB().catch((error) => {
  logger.error('Failed to connect to database:', error);
  process.exit(1);
});

// Initialize Express app
const app = express();

// CORS configuration - MUST be before helmet to avoid conflicts
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://alpha-shop.org',
      'http://alpha-shop.org', // Allow HTTP for redirects
    ];
    
    // In production, strictly enforce CORS
    if (process.env.NODE_ENV === 'production') {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development: allow all origins for easier testing
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-CSRF-Token', // Added for CSRF protection
    'Cache-Control',
    'Pragma',
    'Expires',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Security middleware - configure helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware (must be before body parser for better performance)
app.use(compression({
  threshold: 1024, // Only compress responses above 1KB
  level: 6, // Compression level (0-9, 6 is balanced)
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  },
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Performance monitoring middleware
app.use(performanceMonitor);

// Request logging middleware (enhanced)
app.use(requestLogger);

// Rate limiting middleware - Apply to all API routes
app.use('/api/', apiLimiter);

// Request sanitization middleware
app.use(sanitizeRequest);

// Cache headers middleware
app.use(cacheHeaders);

// HTTP logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Set appropriate content type based on file extension
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Cache control for images
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LIYWAN API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// 404 handler (enhanced)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Join user to their personal room (if authenticated)
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    // Client disconnected
  });

  // Handle client events (if needed)
  socket.on('clientEvent', (data) => {
    // Echo back or process as needed
    socket.emit('serverResponse', { message: 'Event received', data });
  });

  // Send welcome notification
  socket.emit('notification', {
    id: `server-welcome-${Date.now()}`,
    title: 'Welcome!',
    message: 'Connected to real-time updates.',
    type: 'info',
    category: 'System',
    timestamp: new Date().toISOString(),
    isRead: false,
  });
});

// Make io available to other modules (for emitting events from controllers)
app.set('io', io);

// Server port
const PORT = process.env.PORT || 8000;

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 LIYWAN Backend Server running on port ${PORT}`);
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
  } else {
    logger.error('Server error:', err);
  }
  process.exit(1);
});


// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

export { io };

