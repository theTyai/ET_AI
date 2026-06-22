import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { register, httpRequestDurationMicroseconds } from './config/metrics';

// Route imports
import authRouter from './routes/auth.routes';
import documentsRouter from './routes/documents.routes';
import queryRouter from './routes/query.routes';
import equipmentRouter from './routes/equipment.routes';
import workordersRouter from './routes/workorders.routes';
import kgRouter from './routes/kg.routes';
import complianceRouter from './routes/compliance.routes';
import incidentsRouter from './routes/incidents.routes';
import dashboardRouter from './routes/dashboard.routes';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Collect request duration metrics
  app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      end({
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      });
    });
    next();
  });

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting
  app.use('/api/', apiRateLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', environment: env.NODE_ENV });
  });

  // Prometheus Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err: any) {
      res.status(500).end(err.message);
    }
  });

  // Mount API routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/query', queryRouter);
  app.use('/api/v1/equipment', equipmentRouter);
  app.use('/api/v1/workorders', workordersRouter);
  app.use('/api/v1/kg', kgRouter);
  app.use('/api/v1/compliance', complianceRouter);
  app.use('/api/v1/incidents', incidentsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
