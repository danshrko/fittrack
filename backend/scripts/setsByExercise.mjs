import pool from '../config/db.js';

async function doRun(uId = 1) {
  try {
    const [r] = await pool.execute(
      `SELECT se.exercise_id, COUNT(*) as count
       FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE ws.user_id = ?
       GROUP BY se.exercise_id
       ORDER BY count DESC`,
      [uId]
    );
    console.dir(r, { depth: null });
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

const args = process.argv.slice(2).map(a => Number(a));
doRun(args[0] || 1).then(() => process.exit());
