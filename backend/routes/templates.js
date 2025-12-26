import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [templates] = await pool.execute(
      `SELECT id, name, notes, created_at, updated_at
       FROM workout_templates
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [templates] = await pool.execute(
      'SELECT id, name, notes, created_at, updated_at FROM workout_templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];

    const [exercises] = await pool.execute(
      `SELECT te.id, te.order_index, te.notes,
              e.id as exercise_id, e.name, e.muscle_group, e.exercise_type
       FROM template_exercises te
       JOIN exercises e ON te.exercise_id = e.id
       WHERE te.template_id = ?
       ORDER BY te.order_index ASC`,
      [id]
    );

    template.exercises = exercises;

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, notes } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO workout_templates (user_id, name, notes) VALUES (?, ?, ?)',
      [req.user.id, name, notes || null]
    );

    const [templates] = await pool.execute(
      'SELECT id, name, notes, created_at, updated_at FROM workout_templates WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Template created successfully',
      template: templates[0]
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { name, notes } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM workout_templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await pool.execute(
      'UPDATE workout_templates SET name = ?, notes = ? WHERE id = ?',
      [name, notes || null, id]
    );

    const [templates] = await pool.execute(
      'SELECT id, name, notes, created_at, updated_at FROM workout_templates WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Template updated successfully',
      template: templates[0]
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT id FROM workout_templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await pool.execute('DELETE FROM workout_templates WHERE id = ?', [id]);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/exercises', authenticate, [
  body('exercise_id').isInt().withMessage('Exercise ID is required'),
  body('order_index').isInt().withMessage('Order index is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { exercise_id, order_index, notes } = req.body;

    const [templates] = await pool.execute(
      'SELECT id FROM workout_templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const [exercises] = await pool.execute(
      'SELECT id FROM exercises WHERE id = ? AND (created_by IS NULL OR created_by = ?)',
      [exercise_id, req.user.id]
    );

    if (exercises.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO template_exercises (template_id, exercise_id, order_index, notes) VALUES (?, ?, ?, ?)',
      [id, exercise_id, order_index, notes || null]
    );

    const [templateExercises] = await pool.execute(
      `SELECT te.id, te.order_index, te.notes,
              e.id as exercise_id, e.name, e.muscle_group, e.exercise_type
       FROM template_exercises te
       JOIN exercises e ON te.exercise_id = e.id
       WHERE te.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Exercise added to template',
      exercise: templateExercises[0]
    });
  } catch (error) {
    console.error('Add exercise to template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/exercises/:exId', authenticate, [
  body('order_index').isInt().withMessage('Order index is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id, exId } = req.params;
    const { order_index, notes } = req.body;

    const [templates] = await pool.execute(
      'SELECT id FROM workout_templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await pool.execute(
      'UPDATE template_exercises SET order_index = ?, notes = ? WHERE id = ? AND template_id = ?',
      [order_index, notes || null, exId, id]
    );

    const [templateExercises] = await pool.execute(
      `SELECT te.id, te.order_index, te.notes,
              e.id as exercise_id, e.name, e.muscle_group, e.exercise_type
       FROM template_exercises te
       JOIN exercises e ON te.exercise_id = e.id
       WHERE te.id = ?`,
      [exId]
    );

    res.json({
      message: 'Exercise updated in template',
      exercise: templateExercises[0]
    });
  } catch (error) {
    console.error('Update exercise in template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/exercises/:exId', authenticate, async (req, res) => {
  try {
    const { id, exId } = req.params;

    const [templates] = await pool.execute(
      'SELECT id FROM workout_templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await pool.execute(
      'DELETE FROM template_exercises WHERE id = ? AND template_id = ?',
      [exId, id]
    );

    res.json({ message: 'Exercise removed from template' });
  } catch (error) {
    console.error('Remove exercise from template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;