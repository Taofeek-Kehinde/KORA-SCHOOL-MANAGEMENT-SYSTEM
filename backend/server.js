require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================

// ✅ SIMPLE CORS - Allow all origins (works for dev & production)
app.use(cors());

// ✅ Add security headers
app.use(helmet());

// ✅ Logging
app.use(morgan('dev'));

// ✅ Compression
app.use(compression());

// ✅ Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
// ROUTES - ALL REGISTERED ONCE
// =============================================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/registration', require('./src/routes/registrationRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/campuses', require('./src/routes/campusRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/academic', require('./src/routes/academicRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/white-label', require('./src/routes/whiteLabelRoutes'));
app.use('/api/audit', require('./src/routes/auditRoutes'));
app.use('/api/teachers', require('./src/routes/teacherRoutes'));
app.use('/api/staff', require('./src/routes/staffRoutes'));
app.use('/api/students', require('./src/routes/studentRoutes'));
app.use('/api/parents', require('./src/routes/parentRoutes'));
app.use('/api/system', require('./src/routes/systemHealthRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/student-registration', require('./src/routes/studentRegistrationRoutes'));
app.use('/api/student-dashboard', require('./src/routes/studentDashboardRoutes'));
app.use('/api/profile', require('./src/routes/profileRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/bulk-import', require('./src/routes/bulkImportRoutes'));
app.use('/api/promotion', require('./src/routes/promotionRoutes'));
app.use('/api/transfer', require('./src/routes/transferRoutes'));
app.use('/api/withdrawal', require('./src/routes/withdrawalRoutes'));
app.use('/api/graduation', require('./src/routes/graduationRoutes'));
app.use('/api/id-card', require('./src/routes/idCardRoutes'));
app.use('/api/student-notifications', require('./src/routes/studentNotificationRoutes'));
app.use('/api/accountants', require('./src/routes/accountantRoutes'));
app.use('/api/accountant', require('./src/routes/accountantRoutes'));
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
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
  console.log(`Kora Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});