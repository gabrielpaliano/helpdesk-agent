import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import sessionsRouter from './routes/sessions.route';
import chatRouter from './routes/chat.route';
import { swaggerSpec } from './docs/swagger';

const app = express();

app.use(cors());
app.use(express.json());

// Health check — useful for Docker and load balancers
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/sessions', sessionsRouter);
app.use('/chat', chatRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
