import pool from '../config/db.js';

async function run(exerciseId = 1, userId = 1, limit = 20) {
  try {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
    const [rows] = await pool.execute(
      `SELECT es.reps, es.weight_kg, es.duration_seconds, es.set_number,
              ws.id as session_id, ws.date_completed
       FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE se.exercise_id = ? AND ws.user_id = ? AND ws.date_completed IS NOT NULL
       ORDER BY ws.date_completed DESC, ws.id DESC, es.set_number ASC
       LIMIT ${safeLimit}`,
      [exerciseId, userId]
    );

    console.log('Rows:', rows.length);
    console.dir(rows, { depth: null });
  } catch (err) {
    console.error('Query error:', err);
    process.exitCode = 1;
  } finally {
    // close pool
    try { await pool.end(); } catch (e) {}
  }
}

const args = process.argv.slice(2).map(a => Number(a));
run(args[0] || 1, args[1] || 1, args[2] || 20).then(() => process.exit());
