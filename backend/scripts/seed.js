// Inserts a default dev user (id=1) if one doesn't already exist.
// Run with: npm run seed
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const { rows } = await pool.query('SELECT id FROM users WHERE id = 1');
  if (rows.length > 0) {
    console.log('Default user already exists, nothing to do.');
  } else {
    await pool.query(
      `INSERT INTO users (id, name, email, target_calories, target_protein_g)
       VALUES (1, 'Dev User', 'dev@localhost', 2000, 150)`,
    );
    // Keep the sequence in sync so the next auto-generated id starts at 2
    await pool.query(`SELECT setval('users_id_seq', 1)`);
    console.log('Default user created (id=1).');
  }
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
