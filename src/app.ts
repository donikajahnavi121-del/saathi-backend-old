import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

import { ENV } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';

import healthRoutes from './routes/health.routes.js';
import patientRoutes from './routes/patient.routes.js';
import counsellorRoutes from './routes/counsellor.routes.js';
import adminRoutes from './routes/admin.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI and local development
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration (Allows frontend at http://localhost:3000)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || origin === 'http://localhost:3000' || origin === ENV.CORS_ORIGIN) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid blocking testers
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'idempotency-key', 'x-request-id'],
    credentials: true,
  })
);

// Standard Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID Middleware
app.use(requestIdMiddleware);

// General Rate Limiter (moderate 120/min per key/IP)
app.use(generalRateLimiter);

// Static uploads serving
const uploadsDir = path.resolve(ENV.PHOTO_UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads/photos', express.static(uploadsDir));

// OpenAPI / Swagger Documentation at /docs
try {
  const swaggerDocument = JSON.parse(
    fs.readFileSync(path.resolve('./src/docs/swagger.json'), 'utf-8')
  );
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  // Graceful if swagger file missing in bundle
}

// Health Check
app.use(healthRoutes);

// Root redirect to Swagger Documentation
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// API Version 1 Routes
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/counsellor', counsellorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    code: 'ROUTE_NOT_FOUND',
    messageKey: 'common.not_found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
    details: null,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
