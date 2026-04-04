import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDb = async () => {
  try {
    console.log('Reading db_creation.sql...');
    const sqlPath = path.join(__dirname, 'db_creation.sql');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

    console.log('Dropping existing tables to recreate schema...');
    await pool.query('DROP TABLE IF EXISTS bookshelves, libraries, reviews, activities, reading_progress, bookshelf_books, books, users CASCADE;');

    console.log('Executing db_creation.sql on the database...');
    await pool.query(sqlQuery);
    console.log('Database tables successfully created!');
  } catch (error) {
    console.error('Error creating database tables:', error);
  } finally {
    process.exit(0);
  }
};

setupDb();
