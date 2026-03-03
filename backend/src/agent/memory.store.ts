import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import type { Session, StoredMessage, AgentEvent, OpenAIMessage, ToolCall } from '../types';

// PostgreSQL-backed session store.
// Uses a single Pool shared across the process lifetime.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ────────────────────────────────────────────────────────────
// initDb — creates tables if they don't exist yet.
// Call this once at startup before the HTTP server begins listening.
// ────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         UUID        PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL      PRIMARY KEY,
      session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role       TEXT        NOT NULL,
      content    TEXT        NOT NULL,
      timestamp  TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id         SERIAL      PRIMARY KEY,
      session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      type       TEXT        NOT NULL,
      name       TEXT        NOT NULL,
      data       JSONB       NOT NULL,
      timestamp  TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS openai_history (
      id           SERIAL      PRIMARY KEY,
      session_id   UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role         TEXT        NOT NULL,
      content      TEXT,
      tool_calls   JSONB,
      tool_call_id TEXT
    );
  `);
}

// ────────────────────────────────────────────────────────────
// PgStore — async PostgreSQL implementation of the session store.
// All methods are async and return Promises.
// ────────────────────────────────────────────────────────────
class PgStore {
  async create(): Promise<Session> {
    const id = uuid();
    const now = new Date().toISOString();
    await pool.query('INSERT INTO sessions (id, created_at) VALUES ($1, $2)', [id, now]);
    return { id, createdAt: now, messages: [], events: [], openaiHistory: [] };
  }

  async get(sessionId: string): Promise<Session | undefined> {
    const sessionRes = await pool.query<{ id: string; created_at: string }>(
      'SELECT id, created_at FROM sessions WHERE id = $1',
      [sessionId],
    );
    if (sessionRes.rows.length === 0) return undefined;

    const { id, created_at } = sessionRes.rows[0];

    const [messagesRes, eventsRes, historyRes] = await Promise.all([
      pool.query<{ role: string; content: string; timestamp: string }>(
        'SELECT role, content, timestamp FROM messages WHERE session_id = $1 ORDER BY id',
        [sessionId],
      ),
      pool.query<{ type: string; name: string; data: unknown; timestamp: string }>(
        'SELECT type, name, data, timestamp FROM events WHERE session_id = $1 ORDER BY id',
        [sessionId],
      ),
      pool.query<{ role: string; content: string | null; tool_calls: unknown; tool_call_id: string | null }>(
        'SELECT role, content, tool_calls, tool_call_id FROM openai_history WHERE session_id = $1 ORDER BY id',
        [sessionId],
      ),
    ]);

    const messages: StoredMessage[] = messagesRes.rows.map((r) => ({
      role: r.role as 'user' | 'assistant',
      content: r.content,
      timestamp: new Date(r.timestamp).toISOString(),
    }));

    const events: AgentEvent[] = eventsRes.rows.map((r) => ({
      type: r.type as AgentEvent['type'],
      name: r.name,
      data: r.data as Record<string, unknown>,
      timestamp: new Date(r.timestamp).toISOString(),
    }));

    const openaiHistory: OpenAIMessage[] = historyRes.rows.map((r) => {
      if (r.role === 'tool') {
        return { role: 'tool', tool_call_id: r.tool_call_id!, content: r.content! };
      }
      if (r.tool_calls) {
        return { role: 'assistant', content: r.content, tool_calls: r.tool_calls as unknown as ToolCall[] };
      }
      return { role: r.role as 'user' | 'assistant' | 'system', content: r.content! } as OpenAIMessage;
    });

    return { id, createdAt: new Date(created_at).toISOString(), messages, events, openaiHistory };
  }

  async addMessage(sessionId: string, message: StoredMessage): Promise<void> {
    await pool.query(
      'INSERT INTO messages (session_id, role, content, timestamp) VALUES ($1, $2, $3, $4)',
      [sessionId, message.role, message.content, message.timestamp],
    );
  }

  async addEvent(sessionId: string, event: AgentEvent): Promise<void> {
    await pool.query(
      'INSERT INTO events (session_id, type, name, data, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, event.type, event.name, JSON.stringify(event.data), event.timestamp],
    );
  }

  async addOpenAIMessage(sessionId: string, message: OpenAIMessage): Promise<void> {
    if (message.role === 'tool') {
      await pool.query(
        'INSERT INTO openai_history (session_id, role, content, tool_call_id) VALUES ($1, $2, $3, $4)',
        [sessionId, message.role, message.content, message.tool_call_id],
      );
    } else if (message.role === 'assistant' && message.tool_calls) {
      await pool.query(
        'INSERT INTO openai_history (session_id, role, content, tool_calls) VALUES ($1, $2, $3, $4)',
        [sessionId, message.role, message.content, JSON.stringify(message.tool_calls)],
      );
    } else {
      const content = 'content' in message ? message.content : null;
      await pool.query(
        'INSERT INTO openai_history (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, message.role, content],
      );
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    const res = await pool.query('SELECT 1 FROM sessions WHERE id = $1', [sessionId]);
    return res.rows.length > 0;
  }

  async list(): Promise<Array<{ id: string; createdAt: string; messageCount: number; firstMessage: string | null }>> {
    const res = await pool.query<{ id: string; created_at: string; message_count: string; first_message: string | null }>(`
      SELECT s.id, s.created_at, COUNT(m.id) AS message_count,
             (SELECT content FROM messages WHERE session_id = s.id AND role = 'user' ORDER BY id LIMIT 1) AS first_message
      FROM sessions s
      LEFT JOIN messages m ON m.session_id = s.id
      GROUP BY s.id
      HAVING COUNT(m.id) > 0
      ORDER BY s.created_at DESC
    `);
    return res.rows.map((r) => ({
      id: r.id,
      createdAt: new Date(r.created_at).toISOString(),
      messageCount: parseInt(r.message_count, 10),
      firstMessage: r.first_message ?? null,
    }));
  }
}

// Export a singleton — one store for the lifetime of the process
export const memoryStore = new PgStore();
