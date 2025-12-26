import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { body, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'
import { sendEmail } from '../utils/email.js'

const router = express.Router()

async function ensureResetTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token (token),
      INDEX idx_user_used (user_id, used),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

function makeResetLink(token) {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${base}/reset-password?token=${encodeURIComponent(token)}`
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })


      const { name, email, password } = req.body

        const [existingRows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
        if (existingRows.length > 0) return res.status(400).json({ error: 'Email already registered' })

      const passwordHash = await bcrypt.hash(password, 10)
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      )

      const token = jwt.sign({ userId: result.insertId, email, role: 'user' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      })

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: result.insertId, email, name, role: 'user' }
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  }
)

router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

      const { email, password } = req.body

      const [users] = await pool.execute('SELECT id, email, password_hash, name, role FROM users WHERE email = ?', [email])
      if (users.length === 0) return res.status(401).json({ error: 'Email not found' })

      const user = users[0]
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) return res.status(401).json({ error: 'Incorrect password' })

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      })

      res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  }
)

router.post('/forgot', [body('email').isEmail().withMessage('Valid email is required')], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })


    const { email } = req.body
    const [userRows] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email])
    if (userRows.length === 0) return res.json({ message: 'If that account exists, a reset email has been sent.' })

    const usr = userRows[0]
    await ensureResetTable()
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60)

    await pool.execute('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [usr.id, token, expiresAt])
    const resetLink = makeResetLink(token)

    try {
      await sendEmail({
      to: email,
      subject: 'Fittrack password reset',
      text: `Hi ${usr.name || ''},\n\nWe received a request to reset your Fittrack password.\n\nReset your password using this link (valid for 1 hour): ${resetLink}\n\nIf you didn't request this, you can ignore this email.\n`,
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; padding:24px;">
            <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px; border:1px solid #e0e0e0;">
              <h1 style="margin:0 0 16px 0; font-size:20px; color:#111111;">Reset your Fittrack password</h1>
              <p style="margin:0 0 8px 0; color:#444444;">Hi ${user.name || 'there'},</p>
              <p style="margin:0 0 12px 0; color:#444444;">We received a request to reset your password. Click the button below to choose a new one. This link is only valid for <strong>1 hour</strong>.</p>
              <p style="margin:0 0 20px 0; text-align:center;"><a href="${resetLink}" style="display:inline-block; padding:10px 18px; background:#111111; color:#ffffff; text-decoration:none; border-radius:4px; font-size:14px;">Reset password</a></p>
              <p style="margin:0 0 8px 0; color:#777777; font-size:12px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0; color:#555555; font-size:12px; word-break:break-all;"><a href="${resetLink}" style="color:#111111; text-decoration:underline;">${resetLink}</a></p>
              <hr style="border:none; border-top:1px solid #eeeeee; margin:20px 0;">
              <p style="margin:0; color:#999999; font-size:11px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    res.json({ message: 'If that account exists, a reset email has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post(
  '/reset',
  [body('token').notEmpty().withMessage('Token is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

      const { token, password } = req.body
      await ensureResetTable()

      const [records] = await pool.execute(
        `SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = ?`,
        [token]
      )

      if (records.length === 0) return res.status(400).json({ error: 'Invalid or expired token' })

      const record = records[0]
      const now = new Date()
      if (record.used || new Date(record.expires_at) < now) return res.status(400).json({ error: 'Invalid or expired token' })

      const passwordHash = await bcrypt.hash(password, 10)
      await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, record.user_id])
      await pool.execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [record.id])

      res.json({ message: 'Password updated successfully' })
    } catch (error) {
      console.error('Reset password error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  }
)

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

router.put(
  '/profile',
  [authenticate, body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

      const { name, email } = req.body
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id])
      if (existing.length > 0) return res.status(400).json({ error: 'Email already in use' })

      await pool.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id])
      const [rows] = await pool.execute('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [req.user.id])
      res.json({ user: rows[0] })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  }
)

router.put(
  '/password',
  [
    authenticate,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

      const { currentPassword, newPassword } = req.body

      const [users] = await pool.execute(
        'SELECT id, password_hash FROM users WHERE id = ?',
        [req.user.id]
      )

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const user = users[0]
      const isValid = await bcrypt.compare(currentPassword, user.password_hash)

      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }

      const newHash = await bcrypt.hash(newPassword, 10)
      await pool.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newHash, req.user.id]
      )

      res.json({ message: 'Password updated successfully' })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  }
)

export default router;