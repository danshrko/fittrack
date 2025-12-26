import pool from '../config/db.js';

async function run(userId = 1) {
  try {
    const [rows] = await pool.execute(
      `SELECT se.exercise_id, COUNT(*) as count
       FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE ws.user_id = ?
       GROUP BY se.exercise_id
       ORDER BY count DESC`,
      [userId]
    );
    console.dir(rows, { depth: null });
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

const args = process.argv.slice(2).map(a => Number(a));
run(args[0] || 1).then(() => process.exit());
