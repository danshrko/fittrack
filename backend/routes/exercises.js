import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [exercises] = await pool.execute(
      `SELECT id, name, muscle_group, exercise_type, created_by, created_at
       FROM exercises
       WHERE created_by IS NULL OR created_by = ?
       ORDER BY created_by IS NULL DESC, name ASC`,
      [req.user.id]
    );

    res.json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/muscle/:group', authenticate, async (req, res) => {
  try {
    const { group } = req.params;
    const [exercises] = await pool.execute(
      `SELECT id, name, muscle_group, exercise_type, created_by, created_at
       FROM exercises
       WHERE muscle_group = ? AND (created_by IS NULL OR created_by = ?)
       ORDER BY created_by IS NULL DESC, name ASC`,
      [group, req.user.id]
    );

    res.json({ exercises });
  } catch (error) {
    console.error('Get exercises by muscle group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [exercises] = await pool.execute(
      `SELECT id, name, muscle_group, exercise_type, created_by, created_at
       FROM exercises
       WHERE id = ? AND (created_by IS NULL OR created_by = ?)`,
      [id, req.user.id]
    );

    if (exercises.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({ exercise: exercises[0] });
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('muscle_group').trim().notEmpty().withMessage('Muscle group is required'),
  body('exercise_type').isIn(['strength', 'cardio', 'bodyweight']).withMessage('Invalid exercise type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, muscle_group, exercise_type } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES (?, ?, ?, ?)',
      [name, muscle_group, exercise_type, req.user.id]
    );

    const [exercises] = await pool.execute(
      'SELECT id, name, muscle_group, exercise_type, created_by, created_at FROM exercises WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Exercise created successfully',
      exercise: exercises[0]
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('muscle_group').trim().notEmpty().withMessage('Muscle group is required'),
  body('exercise_type').isIn(['strength', 'cardio', 'bodyweight']).withMessage('Invalid exercise type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { name, muscle_group, exercise_type } = req.body;

    const [existing] = await pool.execute(
      'SELECT created_by FROM exercises WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    if (existing[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this exercise' });
    }

    await pool.execute(
      'UPDATE exercises SET name = ?, muscle_group = ?, exercise_type = ? WHERE id = ?',
      [name, muscle_group, exercise_type, id]
    );

    const [exercises] = await pool.execute(
      'SELECT id, name, muscle_group, exercise_type, created_by, created_at FROM exercises WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Exercise updated successfully',
      exercise: exercises[0]
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT created_by FROM exercises WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    if (existing[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this exercise' });
    }

    await pool.execute('DELETE FROM exercises WHERE id = ?', [id]);

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;