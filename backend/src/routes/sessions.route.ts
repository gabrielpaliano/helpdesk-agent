import { Router } from 'express';
import { memoryStore } from '../agent/memory.store';

const router = Router();

// GET /sessions — returns all sessions with message count and first message
router.get('/', async (_req, res) => {
  const sessions = await memoryStore.list();
  res.json(sessions);
});

// POST /sessions — creates a new session and returns its ID
router.post('/', async (_req, res) => {
  const session = await memoryStore.create();
  res.status(201).json({ sessionId: session.id });
});

// GET /sessions/:sessionId/messages — returns full session history
router.get('/:sessionId/messages', async (req, res) => {
  const session = await memoryStore.get(req.params.sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    sessionId: session.id,
    createdAt: session.createdAt,
    messages: session.messages,
    events: session.events,
  });
});

export default router;
