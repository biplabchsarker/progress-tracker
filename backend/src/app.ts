import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import usersRoutes from './modules/users/users.routes';
import teamsRoutes from './modules/teams/teams.routes';
import projectsRoutes from './modules/projects/projects.routes';
import taskRoutes, { projectTasksRouter } from './modules/tasks/tasks.routes';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global rate limit — 100 req/15min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
}));

// Stricter limit on auth endpoints
app.use('/api/v1/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
}));

// Health check — public, no auth
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/projects/:projectId/tasks', projectTasksRouter);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/tasks', taskRoutes);

// 404 for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// Central error handler — must be last
app.use(errorHandler);

export default app;
