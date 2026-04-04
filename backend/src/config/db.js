import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const shouldUseDiscreteConfig =
  Boolean(env.dbHost) &&
  Boolean(env.dbUser) &&
  Boolean(env.dbName) &&
  Boolean(env.dbPassword) &&
  Number.isFinite(env.dbPort);

const useSsl =
  process.env.DB_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  env.nodeEnv === 'production';

export const pool = shouldUseDiscreteConfig
  ? new Pool({
    host: env.dbHost,
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  })
  : new Pool({
    connectionString: env.databaseUrl,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

export const connectDB = async (maxRetries = 5) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      console.log('Connected to PostgreSQL database successfully!');
      client.release();
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(
          `Database connection failed (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('Database connection error after retries:', lastError.stack);
  process.exit(1);
};