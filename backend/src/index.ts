

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';

// Load environment variables
dotenv.config();

console.log('🚀 Starting TeamSync AI Backend...');
console.log(`📡 Port: ${process.env.PORT || 5000}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
app.use('/api', routes);

// ===== ERROR HANDLING =====
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ TeamSync AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Gemini test: http://localhost:${PORT}/api/ai/test (requires auth)`);
});

export default app;