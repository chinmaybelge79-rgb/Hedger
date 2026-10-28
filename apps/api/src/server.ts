import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { instrumentsRouter } from './routes/instruments.js';
import { marketsRouter } from './routes/markets.js';
import { screenerRouter } from './routes/screener.js';
import { devRouter } from './routes/dev.js';
import { savedRouter } from './routes/saved.js';
import { authRouter } from './routes/auth.js';
import { aiRouter } from './routes/ai.js';
import { supportRouter } from './routes/support.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Normalize Vercel serverless request paths
app.use((req, _res, next) => {
  const vercelMatchedPath = req.headers['x-matched-path'] as string | undefined;
  if (vercelMatchedPath && (req.url === '/api' || req.url === '/' || req.url.startsWith('/api?'))) {
    req.url = vercelMatchedPath;
  }
  next();
});

// Request logger
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  const dur = Date.now() - start;
  // quiet logging
});

// API Routes (mounted with and without /api prefix for bulletproof Vercel serverless / proxy support)
app.use('/api/instruments', instrumentsRouter);
app.use('/instruments', instrumentsRouter);
app.use('/api/v1/instruments', instrumentsRouter);
app.use('/v1/instruments', instrumentsRouter);
app.use('/api/markets', marketsRouter);
app.use('/markets', marketsRouter);
app.use('/api/screener', screenerRouter);
app.use('/screener', screenerRouter);
app.use('/api/dev', devRouter);
app.use('/dev', devRouter);
app.use('/api/saved', savedRouter);
app.use('/saved', savedRouter);
app.use('/api/v1/saved', savedRouter);
app.use('/v1/saved', savedRouter);
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/ai', aiRouter);
app.use('/api/support', supportRouter);
app.use('/support', supportRouter);
app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);

app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    service: 'hedger-api'
  });
});

export { app };
export default app;

const isDirectRun = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))
);

if (isDirectRun && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(config.PORT, () => {
    console.log(`Hedger API server listening on http://localhost:${config.PORT}`);
  });
}
