export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentEvent {
  type: 'thought' | 'tool_call' | 'tool_result';
  name: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  messageCount: number;
  firstMessage: string | null;
}
