// ────────────────────────────────────────────────────────────
// Shared types used across the agent, routes, and memory store
// ────────────────────────────────────────────────────────────

export type Intent = 'SUPPORT' | 'STATUS' | 'BILLING' | 'SMALLTALK' | 'UNKNOWN';

export type EventType = 'thought' | 'tool_call' | 'tool_result';

export interface AgentEvent {
  type: EventType;
  name: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// What we expose via GET /sessions/:id/messages
export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  createdAt: string;
  messages: StoredMessage[];
  events: AgentEvent[];
  // Full OpenAI-format history kept separately for LLM context
  openaiHistory: OpenAIMessage[];
}

// Minimal type for OpenAI messages we build manually
export type OpenAIMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type EventCallback = (event: AgentEvent) => void;
