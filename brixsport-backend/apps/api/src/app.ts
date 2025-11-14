import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import routes from './routes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './middleware/errorHandler.middleware';
import { enhancedSecurityHeaders } from './middleware/security-headers.middleware';
import { ddosProtection } from './middleware/ddos.middleware';
import { csrfTokenMiddleware } from './middleware/csrf.middleware';
import { getSecurityMetrics } from './services/security/monitoring.service';

const app = express();

// Enhanced security middleware
app.use(enhancedSecurityHeaders);

// CORS configuration for Vercel frontend
const allowedOriginsForCORS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173']; // Fallback for development

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOriginsForCORS.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard patterns
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Enhanced DDoS protection middleware
app.use(ddosProtection.userAgentAnalysis());
app.use(ddosProtection.blockMaliciousIPs());
app.use(ddosProtection.detectDDoS());
app.use(ddosProtection.adaptiveRateLimiting());
app.use(ddosProtection.challengeSuspiciousRequests());

// CSRF token middleware
app.use(csrfTokenMiddleware);

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security monitoring middleware
// Note: These middleware functions are added in the routes where needed
// app.use(securityMonitoring.monitorAuthAttempts());
// app.use(securityMonitoring.monitorAPIUsage());
// app.use(securityMonitoring.monitorFileUploads());

// CSP violation reporting endpoint
app.post('/csp-report', (req, res) => {
  logger.warn('CSP Violation Report', req.body);
  res.status(204).send();
});

// API routes
app.use('/api', routes);

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Brixsport API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    metrics: getSecurityMetrics()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    message: 'The requested route does not exist'
  });
});

// Error handler
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Create Socket.IO instance with proper CORS for Vercel
const allowedOriginsForSocket = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOriginsForSocket.some(allowed => {
        if (allowed.includes('*')) {
          // Handle wildcard patterns
          const pattern = allowed.replace(/\*/g, '.*');
          return new RegExp(pattern).test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Important for Vercel
  pingTimeout: 60000,
  pingInterval: 25000,
});

export default app;
export { server, io };