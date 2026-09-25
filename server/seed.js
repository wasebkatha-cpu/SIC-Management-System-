import { query } from './db.js';

const seed = async () => {
  try {
    console.log('Seeding database...');
    // Create super admin if not exists
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
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
};

seed();
