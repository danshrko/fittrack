import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import exerciseRoutes from './routes/exercises.js';
import templateRoutes from './routes/templates.js';
import sessionRoutes from './routes/sessions.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';

dotenv.config();

const server = express();
const port = process.env.PORT || 3000;

server.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fittrack API is running' });
});

server.use('/api/auth', authRoutes);
server.use('/api/exercises', exerciseRoutes);
server.use('/api/templates', templateRoutes);
server.use('/api/sessions', sessionRoutes);
server.use('/api/stats', statsRoutes);
server.use('/api/admin', adminRoutes);
server.use('/api/users', userRoutes);

server.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.use((err, req, res, next) => {
  console.error('Error:', err);
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  res.status(err.status || 500).json({ error: message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
});

server.listen(port, () => {
});