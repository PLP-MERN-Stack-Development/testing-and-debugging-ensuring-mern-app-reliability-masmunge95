// server.js - Main server file for the MERN blog application

// Import required modules
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const logger = require('./src/middleware/logger');
const performanceMonitor = require('./src/middleware/performanceMonitor');
const errorHandler = require('./src/middleware/errorHandler');
const { ClerkExpressRequireAuth, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// Load environment variables
dotenv.config();

// Import routes
const postRoutes = require('./src/routes/postRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');

function setupApp(authMiddleware) {
  const appInstance = express();

  // Middleware (copy from above, or refactor)
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,https://mern-blog-manager.netlify.app'
  ).split(',').map(s => s.trim());
  console.log('Allowed CORS origins:', allowedOrigins);
  
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf('*') !== -1 || allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };

  appInstance.use('/api/webhooks', webhookRoutes);
  appInstance.use(cors(corsOptions)); // Apply CORS here
  appInstance.use(express.json({ limit: '10mb' }));
  appInstance.use(express.urlencoded({ extended: true, limit: '10mb' }));
  appInstance.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Add logging and performance middleware
  appInstance.use(logger);
  appInstance.use(performanceMonitor);

  // Define routers for public and private (authenticated) API routes
  const publicApiRouter = express.Router();
  const privateApiRouter = express.Router();

  // Apply authentication middleware to the private router if provided
  if (authMiddleware) {
    privateApiRouter.use(authMiddleware);
  }

  // Assign routes to the appropriate router
  publicApiRouter.use('/posts', postRoutes.public); // Public post routes (GET all, GET one)
  privateApiRouter.use('/posts', postRoutes.private); // Private post routes (CRUD)
  publicApiRouter.use('/categories', categoryRoutes.public); // Public category routes (GET all)
  privateApiRouter.use('/categories', categoryRoutes.private); // Private category routes (CRUD)

  appInstance.use('/api', publicApiRouter);
  appInstance.use('/api', privateApiRouter);

  // Root route
  appInstance.get('/', (req, res) => {
    res.send('MERN Blog API is running');
  });

  // Error handling middleware
  appInstance.use(errorHandler);
  return appInstance;
}

// Start server only when executed directly, not when imported for tests
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    const server = setupApp(ClerkExpressRequireAuth()).listen(PORT, () => console.log(`🚀 API server running on http://localhost:${PORT}`));
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });
  });
}

module.exports = setupApp; 