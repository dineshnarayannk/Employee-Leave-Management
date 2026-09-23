import app from './app.js';
import { config } from './config/env.js';
import { closePool } from './db/index.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Leave Management Server Started`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Health Check (API): http://localhost:${PORT}/api/health`);
  console.log(` Health Check (DB) : http://localhost:${PORT}/api/health/db`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n${signal} signal received: closing server & connection pools...`);
  try {
    await closePool();
    console.log('Database pool closed cleanly.');
  } catch (err) {
    console.error('Error closing database pool:', err.message);
  }

  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
