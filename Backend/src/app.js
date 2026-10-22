const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Behind a reverse proxy (nginx, a PaaS load balancer) in production, so
// req.secure / req.ip reflect the real client, not the proxy hop.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, server-to-server) with no Origin header,
      // and any origin explicitly whitelisted in CLIENT_ORIGIN.
      if (!origin || env.clientOrigins.length === 0 || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.cookieSecret));
app.use(hpp());
app.use(pinoHttp({ logger, autoLogging: env.nodeEnv === 'production' }));
app.use(apiLimiter);

// Uploaded product images, try-on photos, and avatars are served statically.
// In production, put these behind a CDN or object storage (S3, GCS) instead.
app.use('/uploads', express.static(path.join(process.cwd(), env.uploadDir)));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
