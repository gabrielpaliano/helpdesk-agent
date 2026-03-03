import { useState, useEffect, useRef } from 'react';
import type { Message, AgentEvent } from '@/types';

export function useChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    createSession();
  }, []);

  async function createSession() {
    try {
      const r = await fetch('/sessions', { method: 'POST' });
      const { sessionId: id } = await r.json();
      setSessionId(id);
    } catch {
      setError('Não foi possível conectar à API. Certifique-se que o servidor está rodando.');
    }
  }

  async function newSession() {
    abortRef.current?.abort();
    setMessages([]);
    setEvents([]);
    setError(null);
    await createSession();
  }

  async function loadSession(id: string) {
    abortRef.current?.abort();
    try {
      const r = await fetch(`/sessions/${id}/messages`);
      if (!r.ok) return;
      const data = await r.json();
      setSessionId(data.sessionId);
      setMessages(
        (data.messages as { role: 'user' | 'assistant'; content: string }[]).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      );
      setEvents((data.events as AgentEvent[]) ?? []);
      setError(null);
    } catch {
      setError('Falha ao carregar sessão.');
    }
  }

  async function sendMessage(text: string) {
    if (!sessionId || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ sessionId, message: text, metadata: { channel: 'web' } }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Erro ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          const raw = dataLine.slice(6).trim();
          if (raw === '[DONE]') continue;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'message') {
              setMessages((prev) => [...prev, { role: 'assistant', content: parsed.data.assistantMessage }]);
            } else if (parsed.type !== 'error') {
              setEvents((prev) => [...prev, parsed as AgentEvent]);
            }
          } catch {
            // chunk inválido — ignora
          }
        }
      }

      // Trigger sidebar refresh after successful send
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Falha ao enviar mensagem. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function clearEvents() {
    setEvents([]);
  }

  return { sessionId, messages, events, isLoading, error, sendMessage, stop, clearEvents, newSession, loadSession, refreshKey };
}
