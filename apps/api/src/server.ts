import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { instrumentsRouter } from './routes/instruments.js';
import { marketsRouter } from './routes/markets.js';
import { screenerRouter } from './routes/screener.js';
import { devRouter } from './routes/dev.js';
import { savedRouter } from './routes/saved.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  const dur = Date.now() - start;
  // quiet logging
});

// API Routes
app.use('/api/instruments', instrumentsRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/screener', screenerRouter);
app.use('/api/dev', devRouter);
app.use('/api/saved', savedRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    service: 'hedger-api'
  });
});

app.listen(config.PORT, () => {
  console.log(`Hedger API server listening on http://localhost:${config.PORT}`);
});
