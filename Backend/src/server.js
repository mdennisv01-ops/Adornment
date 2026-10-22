const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB, closeDB } = require('./config/db');
const app = require('./app');

let server;

async function start() {
  env.validateProductionConfig();
  await connectDB();
  server = app.listen(env.port, () => {
    logger.info(`Adornment API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

// Fail loudly instead of continuing in a half-broken state.
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  shutdown(1);
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  shutdown(1);
});
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

function shutdown(code) {
  logger.info('Shutting down...');
  const finish = async () => {
    await closeDB();
    process.exit(code);
  };

  if (server) {
    server.close(() => {
      finish().catch((err) => {
        logger.error({ err }, 'Error during shutdown');
        process.exit(code);
      });
    });
    return;
  }

  finish().catch((err) => {
    logger.error({ err }, 'Error during shutdown');
    process.exit(code);
  });
}

start();
