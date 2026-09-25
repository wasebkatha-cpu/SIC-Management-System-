import { query } from './db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- Superuser Password Reset ---');
console.log('This script will reset the password for the "superuser" account.');

rl.question('Enter the new password for superuser: ', async (newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    console.error('Password must be at least 6 characters long.');
    rl.close();
    process.exit(1);
  }

  try {
    const result = await query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id',
      [newPassword, 'superuser']
    );

    if (result.rowCount === 0) {
      console.error('Superuser account not found! Ensure the database is initialized.');
    } else {
      console.log('Success! Superuser password has been updated.');
    }
  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
});
