import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/weekly-summary', authenticate, async (req, res) => {
  try {
    const userId = (req.user.role === 'admin' && req.query.user_id)
      ? Number(req.query.user_id)
      : req.user.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [workouts] = await pool.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM workout_sessions
       WHERE user_id = ? AND date_completed >= ?`,
      [userId, sevenDaysAgo]
    );

    const [volume] = await pool.execute(
      `SELECT COALESCE(SUM(es.reps * es.weight_kg), 0) as total_volume
       FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE ws.user_id = ? AND ws.date_completed >= ? AND es.weight_kg IS NOT NULL`,
      [userId, sevenDaysAgo]
    );

    const [prs] = await pool.execute(
      `SELECT pr.id, pr.exercise_id, pr.max_weight, pr.achieved_at, e.name as exercise_name
       FROM personal_records pr
       JOIN exercises e ON pr.exercise_id = e.id
       WHERE pr.user_id = ? AND pr.achieved_at >= ?`,
      [userId, sevenDaysAgo]
    );

    res.json({
      workoutsCount: workouts[0].count,
      totalMinutes: workouts[0].total_minutes,
      totalVolume: volume[0].total_volume || 0,
      newPRs: prs
    });
  } catch (error) {
    console.error('Get weekly summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/progress', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [monthlyWorkouts] = await pool.execute(
      `SELECT DATE_FORMAT(date_completed, '%Y-%m') as month, COUNT(*) as count
       FROM workout_sessions
       WHERE user_id = ? AND date_completed >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [userId]
    );

    const [monthlyVolume] = await pool.execute(
      `SELECT DATE_FORMAT(ws.date_completed, '%Y-%m') as month, COALESCE(SUM(es.reps * es.weight_kg), 0) as volume
       FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE ws.user_id = ? AND ws.date_completed >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND es.weight_kg IS NOT NULL
       GROUP BY month
       ORDER BY month ASC`,
      [userId]
    );

    res.json({
      monthlyWorkouts,
      monthlyVolume
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;