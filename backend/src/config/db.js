import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

console.log("Attempting to connect with URL:", env.databaseUrl); // Add this line

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database successfully!");
    client.release();
  } catch (err) {
    console.error("Database connection error:", err.stack);
    process.exit(1); // Exit the process if the database is unreachable
  }
};