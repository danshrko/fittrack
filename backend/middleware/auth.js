import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [users] = await pool.execute(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = users[0];
      return next();
    } catch (jwtErr) {
    }

    try {
      const [tokens] = await pool.execute(
        'SELECT id, name, token_hash, created_by, revoked, expires_at FROM service_tokens WHERE revoked = 0'
      );

      for (const t of tokens) {
        const match = await bcrypt.compare(token, t.token_hash);
        if (match) {
          if (t.expires_at && new Date(t.expires_at) < new Date()) {
            return res.status(401).json({ error: 'Service token expired' });
          }

          const [users] = await pool.execute('SELECT id, email, name, role FROM users WHERE id = ?', [t.created_by]);
          const adminUser = users.length ? users[0] : { id: null, email: 'service', name: 'service', role: 'admin' };

          req.user = { ...adminUser, isServiceToken: true };
          return next();
        }
      }

      return res.status(401).json({ error: 'Invalid token' });
    } catch (err) {
      console.error('Service token check error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

