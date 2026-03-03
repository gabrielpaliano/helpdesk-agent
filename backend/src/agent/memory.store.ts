import { v4 as uuid } from 'uuid';
import type { Session, StoredMessage, AgentEvent, OpenAIMessage } from '../types';

// Simple in-memory store. For production, swap this with Redis.
// Using a Map keyed by sessionId gives O(1) access with no external deps.
class MemoryStore {
  private sessions = new Map<string, Session>();

  create(): Session {
    const session: Session = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      messages: [],
      events: [],
      openaiHistory: [],
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId: string, message: StoredMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.messages.push(message);
  }

  addEvent(sessionId: string, event: AgentEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.events.push(event);
  }

  addOpenAIMessage(sessionId: string, message: OpenAIMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.openaiHistory.push(message);
  }

  exists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

// Export a singleton — one store for the lifetime of the process
export const memoryStore = new MemoryStore();
