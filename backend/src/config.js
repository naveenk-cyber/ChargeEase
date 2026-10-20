'use strict';

const path = require('node:path');
const crypto = require('node:crypto');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

/**
 * In production a real secret is mandatory. In development we generate a
 * throwaway one so the app still runs, but every restart invalidates tokens.
 */
function resolveSecret() {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 16) return configured;
  if (isProduction) {
    throw new Error(
      'JWT_SECRET must be set to a random value of at least 16 characters in production.',
    );
  }
  return crypto.randomBytes(48).toString('base64url');
}

const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: resolveSecret(),
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 168),
  databaseFile: process.env.DATABASE_FILE || './data/chargeease.db',
  publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
  currency: process.env.CURRENCY || 'USD',
  distanceUnit: process.env.DISTANCE_UNIT || 'miles',
};

module.exports = config;
