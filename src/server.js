const app = require('./app');
const connectDB = require('./config/db');
const { env } = require('./config/env');
const logger = require('./utils/logger');

let server;

async function startServer() {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`SalonGo API running on port ${env.PORT}`);
  });
}

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled rejection: ${error.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

startServer();
