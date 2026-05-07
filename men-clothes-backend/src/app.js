import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

import { config } from './config/index.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import addressRoutes from './routes/address.routes.js';
import brandRoutes from './routes/brand.routes.js';
import categoryRoutes from './routes/category.routes.js';


const app = express();
const prisma = new PrismaClient();

// Security & parsing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting per route
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, keyGenerator: (req) => req.ip });
app.use('/api/auth', authLimiter);

const orderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 50, keyGenerator: (req) => req.user?.id || req.ip });
app.use('/api/orders', orderLimiter);

// Default limiter for other API routes
const defaultLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', defaultLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/addresses', addressRoutes);

app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);

// Health check with database
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'disconnected' });
  }
});

app.get('/', (req, res) => res.json({ message: "Men's Clothing Backend is Deployed" }));

// Global error handler (catches all errors and returns clean JSON)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});



export default app;