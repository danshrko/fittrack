import pool from '../config/db.js';

async function run() {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as c FROM exercise_sets');
    console.log('total sets:', rows[0].c);
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

run().then(() => process.exit());
