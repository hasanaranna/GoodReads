import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
  process.on('SIGINT', () => {
    console.log('SIGINT received. Closing HTTP server...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
};

startServer();