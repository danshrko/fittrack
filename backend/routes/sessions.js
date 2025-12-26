import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [sessions] = await pool.execute(
      `SELECT id, template_id, name, date_started, date_completed, duration_minutes, notes, created_at
       FROM workout_sessions
       WHERE user_id = ?
       ORDER BY date_started DESC`,
      [req.user.id]
    );

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [sessions] = await pool.execute(
      'SELECT id, template_id, name, date_started, date_completed, duration_minutes, notes FROM workout_sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions[0];

    const [exercises] = await pool.execute(
      `SELECT se.id, se.order_index, se.notes,
              e.id as exercise_id, e.name, e.muscle_group, e.exercise_type
       FROM session_exercises se
       JOIN exercises e ON se.exercise_id = e.id
       WHERE se.session_id = ?
       ORDER BY se.order_index ASC`,
      [id]
    );

    for (const exercise of exercises) {
      const [sets] = await pool.execute(
        `SELECT id, set_number, reps, weight_kg, duration_seconds, notes
         FROM exercise_sets
         WHERE session_exercise_id = ?
         ORDER BY set_number ASC`,
        [exercise.id]
      );
      exercise.sets = sets;
    }

    session.exercises = exercises;

    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/template/:id/last', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [sessions] = await pool.execute(
      `SELECT id FROM workout_sessions
       WHERE user_id = ? AND template_id = ? AND date_completed IS NOT NULL
       ORDER BY date_completed DESC
       LIMIT 1`,
      [req.user.id, id]
    );

    if (sessions.length === 0) {
      return res.json({ lastSession: null });
    }

    const sessionId = sessions[0].id;

    const [exercises] = await pool.execute(
      `SELECT se.id, se.exercise_id, e.name, e.exercise_type
       FROM session_exercises se
       JOIN exercises e ON se.exercise_id = e.id
       WHERE se.session_id = ?
       ORDER BY se.order_index ASC`,
      [sessionId]
    );

    for (const exercise of exercises) {
      const [sets] = await pool.execute(
        `SELECT set_number, reps, weight_kg, duration_seconds
         FROM exercise_sets
         WHERE session_exercise_id = ?
         ORDER BY set_number ASC`,
        [exercise.id]
      );
      exercise.sets = sets || [];
    }

    res.json({ lastSession: { exercises } });
  } catch (error) {
    console.error('Get last session error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/start', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, template_id, notes } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO workout_sessions (user_id, template_id, name, date_started, notes) VALUES (?, ?, ?, NOW(), ?)',
      [req.user.id, template_id || null, name, notes || null]
    );

    const sessionId = result.insertId;

    if (req.body.exercises && Array.isArray(req.body.exercises)) {
      for (let i = 0; i < req.body.exercises.length; i++) {
        const ex = req.body.exercises[i];
        const [exResult] = await pool.execute(
          'INSERT INTO session_exercises (session_id, exercise_id, order_index, notes) VALUES (?, ?, ?, ?)',
          [sessionId, ex.exercise_id, i + 1, ex.notes || null]
        );
      }
    }

    const [sessions] = await pool.execute(
      'SELECT id, template_id, name, date_started, date_completed, duration_minutes, notes FROM workout_sessions WHERE id = ?',
      [sessionId]
    );

    res.status(201).json({
      message: 'Workout session started',
      session: sessions[0]
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/exercises', authenticate, [
  body('exercise_id').isInt().withMessage('Exercise ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { exercise_id, notes } = req.body;

    const [sessions] = await pool.execute(
      'SELECT id, date_completed FROM workout_sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessions[0].date_completed) {
      return res.status(400).json({ error: 'Cannot modify a completed session' });
    }

    const [existingExercises] = await pool.execute(
      'SELECT COALESCE(MAX(order_index), 0) AS max_order FROM session_exercises WHERE session_id = ?',
      [id]
    );
    const nextOrder = (existingExercises[0].max_order || 0) + 1;

    const [insertResult] = await pool.execute(
      'INSERT INTO session_exercises (session_id, exercise_id, order_index, notes) VALUES (?, ?, ?, ?)',
      [id, exercise_id, nextOrder, notes || null]
    );

    const [sessionExercise] = await pool.execute(
      `SELECT se.id, se.session_id, se.exercise_id, se.order_index, se.notes,
              e.name, e.exercise_type, e.muscle_group
       FROM session_exercises se
       JOIN exercises e ON se.exercise_id = e.id
       WHERE se.id = ?`,
      [insertResult.insertId]
    );

    res.status(201).json({
      message: 'Exercise added to session',
      sessionExercise: sessionExercise[0]
    });
  } catch (error) {
    console.error('Add exercise to session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/complete', authenticate, [
  body('duration_minutes').isInt().withMessage('Duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { duration_minutes } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await pool.execute(
      'UPDATE workout_sessions SET date_completed = NOW(), duration_minutes = ? WHERE id = ?',
      [duration_minutes, id]
    );

    const [sessionExercises] = await pool.execute(
      `SELECT se.exercise_id, MAX(es.weight_kg) as max_weight
       FROM session_exercises se
       JOIN exercise_sets es ON se.id = es.session_exercise_id
       WHERE se.session_id = ? AND es.weight_kg IS NOT NULL
       GROUP BY se.exercise_id`,
      [id]
    );
      for (const ex of sessionExercises) {
        if (!ex.max_weight) continue;

        const [existingPR] = await pool.execute(
          'SELECT id, max_weight FROM personal_records WHERE user_id = ? AND exercise_id = ?',
          [req.user.id, ex.exercise_id]
        );

        if (existingPR.length === 0) {
          await pool.execute(
            'INSERT INTO personal_records (user_id, exercise_id, max_weight, achieved_at, session_id) VALUES (?, ?, ?, NOW(), ?)',
            [req.user.id, ex.exercise_id, ex.max_weight, id]
          );
        } else if (parseFloat(ex.max_weight) > parseFloat(existingPR[0].max_weight)) {
          await pool.execute(
            'UPDATE personal_records SET max_weight = ?, achieved_at = NOW(), session_id = ? WHERE id = ?',
            [ex.max_weight, id, existingPR[0].id]
          );
        }
      }

    res.json({ message: 'Workout completed successfully' });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/sets', authenticate, [
  body('session_exercise_id').isInt().withMessage('Session exercise ID is required'),
  body('set_number').isInt().withMessage('Set number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { session_exercise_id, set_number, reps, weight_kg, duration_seconds, notes } = req.body;

    const [sessions] = await pool.execute(
      'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const [sessionExercises] = await pool.execute(
      'SELECT id FROM session_exercises WHERE id = ? AND session_id = ?',
      [session_exercise_id, id]
    );

    if (sessionExercises.length === 0) {
      return res.status(404).json({ error: 'Session exercise not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO exercise_sets (session_exercise_id, set_number, reps, weight_kg, duration_seconds, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [session_exercise_id, set_number, reps || null, weight_kg || null, duration_seconds || null, notes || null]
    );

    const [sets] = await pool.execute(
      'SELECT id, set_number, reps, weight_kg, duration_seconds, notes FROM exercise_sets WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Set logged',
      set: sets[0]
    });
  } catch (error) {
    console.error('Log set error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/sets/:setId', authenticate, [
  body('set_number').isInt().withMessage('Set number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { setId } = req.params;
    const { set_number, reps, weight_kg, duration_seconds, notes } = req.body;

    const [sets] = await pool.execute(
      `SELECT es.id FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE es.id = ? AND ws.user_id = ?`,
      [setId, req.user.id]
    );

    if (sets.length === 0) {
      return res.status(404).json({ error: 'Set not found' });
    }

    await pool.execute(
      'UPDATE exercise_sets SET set_number = ?, reps = ?, weight_kg = ?, duration_seconds = ?, notes = ? WHERE id = ?',
      [set_number, reps || null, weight_kg || null, duration_seconds || null, notes || null, setId]
    );

    const [updatedSets] = await pool.execute(
      'SELECT id, set_number, reps, weight_kg, duration_seconds, notes FROM exercise_sets WHERE id = ?',
      [setId]
    );

    res.json({
      message: 'Set updated',
      set: updatedSets[0]
    });
  } catch (error) {
    console.error('Update set error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/sets/:setId', authenticate, async (req, res) => {
  try {
    const { setId } = req.params;

    const [sets] = await pool.execute(
      `SELECT es.id FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE es.id = ? AND ws.user_id = ?`,
      [setId, req.user.id]
    );

    if (sets.length === 0) {
      return res.status(404).json({ error: 'Set not found' });
    }

    await pool.execute('DELETE FROM exercise_sets WHERE id = ?', [setId]);

    res.json({ message: 'Set deleted' });
  } catch (error) {
    console.error('Delete set error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;