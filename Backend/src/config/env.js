const path = require('path');

const backendEnvPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: backendEnvPath });

function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  return value === undefined ? fallback : value;
}

function requiredEnv(name) {
  const value = getEnv(name);
  if (!value) {
    // Fail fast and loudly rather than booting with a broken auth/db config.
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function validateProductionConfig() {
  if (getEnv('NODE_ENV', 'development') !== 'production') return;
  const accessSecret = requiredEnv('JWT_ACCESS_SECRET');
  const refreshSecret = requiredEnv('JWT_REFRESH_SECRET');
  const cookieSecret = requiredEnv('COOKIE_SECRET');
  for (const [name, value] of [
    ['JWT_ACCESS_SECRET', accessSecret],
    ['JWT_REFRESH_SECRET', refreshSecret],
    ['COOKIE_SECRET', cookieSecret],
  ]) {
    if (value.length < 32 || /change[_ -]?this|secret|password/i.test(value)) {
      throw new Error(`${name} must be a unique random value with at least 32 characters in production`);
    }
  }
  if (new Set([accessSecret, refreshSecret, cookieSecret]).size !== 3) {
    throw new Error('JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and COOKIE_SECRET must be different values');
  }
  const origins = (getEnv('CLIENT_ORIGIN', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => !origin.startsWith('https://'))) {
    throw new Error('Set CLIENT_ORIGIN to the HTTPS storefront and admin origins in production');
  }
  const sameSite = getEnv('COOKIE_SAME_SITE', 'lax');
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
  }
}

module.exports = {
  validateProductionConfig,
  get nodeEnv() {
    return getEnv('NODE_ENV', 'development');
  },
  get port() {
    return parseInt(getEnv('PORT', '4000'), 10) || 4000;
  },
  get clientOrigins() {
    return (getEnv('CLIENT_ORIGIN', '') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },

  get mongodbUri() {
    return requiredEnv('MONGODB_URI');
  },

  get jwt() {
    return {
      accessSecret: requiredEnv('JWT_ACCESS_SECRET'),
      refreshSecret: requiredEnv('JWT_REFRESH_SECRET'),
      accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
      refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
    };
  },
  get cookieSecret() {
    return requiredEnv('COOKIE_SECRET');
  },
  get cookieSameSite() {
    return getEnv('COOKIE_SAME_SITE', 'lax');
  },

  get uploadDir() {
    return getEnv('UPLOAD_DIR', 'uploads');
  },
  get maxUploadMb() {
    return parseInt(getEnv('MAX_UPLOAD_MB', '8'), 10) || 8;
  },

  get aiProvider() {
    return {
      baseUrl: getEnv('AI_PROVIDER_BASE_URL', ''),
      apiKey: getEnv('AI_PROVIDER_API_KEY', ''),
    };
  },

  get rateLimit() {
    return {
      windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', String(15 * 60 * 1000)), 10) || 15 * 60 * 1000,
      max: parseInt(getEnv('RATE_LIMIT_MAX', '300'), 10) || 300,
    };
  },
};
