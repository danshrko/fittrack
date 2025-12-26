import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [workoutsCount] = await pool.execute('SELECT COUNT(*) as count FROM workout_sessions WHERE date_completed IS NOT NULL');
    const [exercisesCount] = await pool.execute('SELECT COUNT(*) as count FROM exercises WHERE created_by IS NULL');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [activeUsers] = await pool.execute(
      'SELECT COUNT(DISTINCT user_id) as count FROM workout_sessions WHERE date_completed >= ?',
      [sevenDaysAgo]
    );

    const [recentUsers] = await pool.execute(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      stats: {
        totalUsers: usersCount[0].count,
        totalWorkouts: workoutsCount[0].count,
        totalExercises: exercisesCount[0].count,
        activeUsers: activeUsers[0].count
      },
      recentUsers
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:id/role', [
  body('role').isIn(['user', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { role } = req.body;

    const [existing] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/exercises', async (req, res) => {
  try {
    const [exercises] = await pool.execute(
      'SELECT id, name, muscle_group, exercise_type, created_at FROM exercises WHERE created_by IS NULL ORDER BY muscle_group, name'
    );

    res.json({ exercises });
  } catch (error) {
    console.error('Get admin exercises error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/service-tokens', [
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const { name } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO service_tokens (name, token_hash, created_by) VALUES (?, ?, ?)',
      [name, tokenHash, req.user.id]
    );

    const [rows] = await pool.execute('SELECT id, name, created_by, revoked, expires_at, created_at FROM service_tokens WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Service token created',
      token: token,
      token_meta: rows[0]
    });
  } catch (error) {
    console.error('Create service token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/service-tokens', async (req, res) => {
  try {
    const [tokens] = await pool.execute('SELECT id, name, created_by, revoked, expires_at, created_at FROM service_tokens ORDER BY created_at DESC');
    res.json({ tokens });
  } catch (error) {
    console.error('List service tokens error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/service-tokens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT id FROM service_tokens WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Token not found' });

    await pool.execute('UPDATE service_tokens SET revoked = 1 WHERE id = ?', [id]);
    res.json({ message: 'Service token revoked' });
  } catch (error) {
    console.error('Revoke service token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/exercises', [
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
      'INSERT INTO exercises (name, muscle_group, exercise_type, created_by) VALUES (?, ?, ?, NULL)',
      [name, muscle_group, exercise_type]
    );

    const [exercises] = await pool.execute(
      'SELECT id, name, muscle_group, exercise_type, created_at FROM exercises WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Global exercise created successfully',
      exercise: exercises[0]
    });
  } catch (error) {
    console.error('Create global exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/exercises/:id', [
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
      'SELECT id FROM exercises WHERE id = ? AND created_by IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Global exercise not found' });
    }

    await pool.execute(
      'UPDATE exercises SET name = ?, muscle_group = ?, exercise_type = ? WHERE id = ?',
      [name, muscle_group, exercise_type, id]
    );

    const [exercises] = await pool.execute(
      'SELECT id, name, muscle_group, exercise_type, created_at FROM exercises WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Global exercise updated successfully',
      exercise: exercises[0]
    });
  } catch (error) {
    console.error('Update global exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT id FROM exercises WHERE id = ? AND created_by IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Global exercise not found' });
    }

    await pool.execute('DELETE FROM exercises WHERE id = ?', [id]);

    res.json({ message: 'Global exercise deleted successfully' });
  } catch (error) {
    console.error('Delete global exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;