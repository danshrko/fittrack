import pool from '../config/db.js';

async function doRun() {
  try {
    const [r] = await pool.execute('SELECT COUNT(*) as c FROM exercise_sets');
    console.log('total sets:', r[0].c);
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

doRun().then(() => process.exit());
