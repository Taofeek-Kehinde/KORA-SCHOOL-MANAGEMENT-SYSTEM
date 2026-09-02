const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// =============================================
// CORS CONFIGURATION
// =============================================
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// =============================================
// IMPORTANT: Increase payload size limits
// =============================================
app.use(express.json({ 
  limit: '50mb'  // Increased from 10mb to 50mb
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb'   // Increased from 10mb to 50mb
}));

// =============================================
// OTHER MIDDLEWARE
// =============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev'));

// =============================================
// RATE LIMITING
// =============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api', limiter);

// =============================================
// HEALTH CHECK
// =============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Kora School Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// ROUTES
// =============================================
const authRoutes = require('./routes/authRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const billingRoutes = require('./routes/billingRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const subscriptionConfigRoutes = require('./routes/subscriptionConfigRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditRoutes = require('./routes/auditRoutes');
const aiRoutes = require('./routes/aiRoutes');
const academicRoutes = require('./routes/academicRoutes');
const campusRoutes = require('./routes/campusRoutes');
const whiteLabelRoutes = require('./routes/whiteLabelRoutes');
const profileRoutes = require('./routes/profileRoutes');
const searchRoutes = require('./routes/searchRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/subscription-config', subscriptionConfigRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);

// =============================================
// 404 HANDLER
// =============================================
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// =============================================
// ERROR HANDLER
// =============================================
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;