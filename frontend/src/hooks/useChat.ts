import { useState, useEffect, useRef } from 'react';
import type { Message, AgentEvent } from '@/types';

// Toda a lógica de estado e comunicação com a API fica aqui.
// O componente App fica só com a renderização.
export function useChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cria sessão automaticamente quando o componente monta
  useEffect(() => {
    fetch('/sessions', { method: 'POST' })
      .then((r) => r.json())
      .then(({ sessionId }) => setSessionId(sessionId))
      .catch(() => setError('Não foi possível conectar à API. Certifique-se que o servidor está rodando.'));
  }, []);

  async function sendMessage(text: string) {
    if (!sessionId || isLoading) return;

    // Mostra a mensagem do usuário imediatamente (sem esperar a API)
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    setError(null);

    // Cancela qualquer request anterior
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      // Usamos SSE (Accept: text/event-stream) para receber eventos em tempo real
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

      // Lê o stream de SSE manualmente com ReadableStream
      // EventSource não suporta POST, por isso usamos fetch + stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE envia eventos separados por \n\n
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
              // Mensagem final do assistente
              setMessages((prev) => [...prev, { role: 'assistant', content: parsed.data.assistantMessage }]);
            } else if (parsed.type !== 'error') {
              // Eventos intermediários: thought, tool_call, tool_result
              setEvents((prev) => [...prev, parsed as AgentEvent]);
            }
          } catch {
            // chunk inválido — ignora
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Falha ao enviar mensagem. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearEvents() {
    setEvents([]);
  }

  return { sessionId, messages, events, isLoading, error, sendMessage, clearEvents };
}
