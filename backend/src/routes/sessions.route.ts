import { Router } from 'express';
import { memoryStore } from '../agent/memory.store';

const router = Router();

// POST /sessions — creates a new session and returns its ID
router.post('/', (_req, res) => {
  const session = memoryStore.create();
  res.status(201).json({ sessionId: session.id });
});

// GET /sessions/:sessionId/messages — returns full session history
router.get('/:sessionId/messages', (req, res) => {
  const session = memoryStore.get(req.params.sessionId);

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
