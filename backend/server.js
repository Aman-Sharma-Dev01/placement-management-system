const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars BEFORE anything else. Several services capture configuration in
// module scope (retry backoff, scheduler toggles, reset-token lifetime), so a
// later `dotenv.config()` would leave them stuck on the built-in defaults.
dotenv.config();

const connectDB = require('./config/db');
const queue = require('./services/queue');
const emailService = require('./services/emailService');
const reminderScheduler = require('./services/reminderScheduler');
const { notifyAdminsOfCrash } = require('./services/adminAlertService');
const Notification = require('./models/Notification');
const EmailLog = require('./models/EmailLog');
const PasswordResetToken = require('./models/PasswordResetToken');

/**
 * Notification idempotency depends on a unique sparse index on
 * `Notification.eventKey`. Mongoose only creates indexes automatically when
 * `autoIndex` is on, which is normally disabled in production — so create any
 * missing indexes explicitly at boot. `createIndexes` is additive and never
 * drops anything.
 */
const ensureIndexes = async () => {
  for (const model of [Notification, EmailLog, PasswordResetToken]) {
    try {
      await model.createIndexes();
    } catch (error) {
      console.error(`[startup] Index creation failed for ${model.modelName}:`, error.message);
    }
  }
};

// Connect to database
connectDB();

const app = express();

// Middleware

app.use(
  cors({
    origin: ["https://subset-tau.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/drives', require('./routes/drive.routes'));
app.use('/api/companies', require('./routes/company.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/blogs', require('./routes/blog.routes'));

// Health check. Reports email readiness so a deployment with missing SMTP
// config is obvious instead of silently dropping notifications.
app.get('/api/health', async (req, res) => {
  const mailer = require('./utils/mailer');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    email: {
      configured: mailer.isConfigured(),
      queue: queue.stats(),
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

  // Background email + reminder infrastructure. None of this blocks boot: an
  // unreachable SMTP relay must not stop the API from serving.
  queue.start();
  reminderScheduler.start();
  ensureIndexes().catch((error) => {
    console.error('Index bootstrap failed:', error.message);
  });
  emailService.verifyTransport().catch((error) => {
    console.error('Email transport check failed:', error.message);
  });
});

// An unhandled rejection is logged and alerted, then the process keeps serving.
// An uncaught exception is different: process state is unknown afterwards, so
// we alert, then exit and let the platform restart us cleanly.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  notifyAdminsOfCrash('unhandledRejection', reason?.message || String(reason)).catch(() => {});
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  notifyAdminsOfCrash('uncaughtException', error?.message || String(error)).catch(() => {});
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
});

// Graceful shutdown so the queue and SMTP pool are not cut mid-send.
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  reminderScheduler.stop();
  queue.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));


