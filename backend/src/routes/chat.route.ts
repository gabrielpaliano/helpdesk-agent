import { Router } from 'express';
import { runAgent } from '../agent/agent.service';
import { memoryStore } from '../agent/memory.store';
import { rateLimitBySession } from '../middleware/rate-limit';
import type { AgentEvent } from '../types';

const router = Router();

// POST /chat — main agent entry point
//
// Supports two response modes:
//   - Default: JSON with { sessionId, assistantMessage, events }
//   - SSE: stream events in real-time (send Accept: text/event-stream header)
//
// SSE is useful for UIs that want to show "thinking..." indicators.
router.post('/', rateLimitBySession, async (req, res) => {
  const { sessionId, message, metadata } = req.body as {
    sessionId: string;
    message: string;
    metadata?: { userId?: string; channel?: string };
  };

  if (!sessionId || !message) {
    res.status(400).json({ error: 'sessionId and message are required' });
    return;
  }

  if (!(await memoryStore.exists(sessionId))) {
    res.status(404).json({ error: 'Session not found. Call POST /sessions first.' });
    return;
  }

  // Log minimal request info — helps debugging without leaking sensitive data
  console.log(`[chat] session=${sessionId} channel=${metadata?.channel ?? 'unknown'} msg="${message.slice(0, 60)}..."`);

  const wantsSSE = req.headers.accept === 'text/event-stream';

  if (wantsSSE) {
    // ── SSE mode ────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: AgentEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const assistantMessage = await runAgent(sessionId, message, sendEvent);
      res.write(`data: ${JSON.stringify({ type: 'message', data: { assistantMessage } })}\n\n`);
      res.write('data: [DONE]\n\n');
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Agent error' } })}\n\n`);
    } finally {
      res.end();
    }
  } else {
    // ── JSON mode (default) ─────────────────────────────────
    const events: AgentEvent[] = [];

    try {
      const assistantMessage = await runAgent(sessionId, message, (event) => {
        events.push(event);
      });

      res.json({ sessionId, assistantMessage, events });
    } catch (err) {
      console.error('[chat] agent error:', err);
      res.status(500).json({ error: 'Internal agent error' });
    }
  }
});

export default router;
