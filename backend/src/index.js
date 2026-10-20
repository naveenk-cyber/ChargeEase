'use strict';

const config = require('./config');
const { getDatabase } = require('./db');
const { createApp } = require('./app');
const { seedIfEmpty } = require('./seed');

function start() {
  const db = getDatabase();

  // Convenience for local development: fill an empty database with sample data.
  // Set SEED_ON_START=false to disable.
  if (process.env.SEED_ON_START !== 'false') {
    seedIfEmpty(db);
  }

  const app = createApp(db);
  const server = app.listen(config.port, () => {
    console.log(`ChargeEase API listening on http://localhost:${config.port}${config.apiPrefix}`);
    console.log(`Environment: ${config.nodeEnv}`);
    if (!config.isProduction) {
      console.log('Sample station data is seeded automatically when the database is empty.');
    }
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = { start };
