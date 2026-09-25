import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initDb = async () => {
  try {
    console.log('Initializing database schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await query(schemaSql);
    console.log('Database schema created successfully.');

    // Now seed it
    console.log('Seeding database...');
    const superAdmin = await query('SELECT * FROM users WHERE username = $1', ['superuser']);
    if (superAdmin.rows.length === 0) {
      await query(
        `INSERT INTO users (id, username, password, name, role, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        ['super-1', 'superuser', 'password123', 'Master Admin', 'superUser']
      );
      console.log('Superuser created.');
    } else {
      console.log('Superuser already exists.');
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
