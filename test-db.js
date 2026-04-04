import { pool } from "./backend/src/config/db.js";

async function test() {
  try {
    const result = await pool.query("SELECT * FROM users LIMIT 1");
    console.log(result.rows);
  } catch (err) {
    console.error("error!", err);
  } finally {
    process.exit(0);
  }
}
test();
