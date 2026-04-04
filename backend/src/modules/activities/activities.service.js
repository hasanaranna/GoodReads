import { pool } from "../../config/db.js";

export async function getUserActivities(userId) {
  const result = await pool.query(
    `SELECT id, action, timestamp FROM activities WHERE by_user_id = $1 ORDER BY timestamp DESC LIMIT 50`,
    [userId]
  );
  return result.rows;
}

export async function logActivity(userId, action) {
  const result = await pool.query(
    `INSERT INTO activities (action, by_user_id) VALUES ($1, $2) RETURNING id, action, timestamp`,
    [action, userId]
  );
  return result.rows[0];
}
