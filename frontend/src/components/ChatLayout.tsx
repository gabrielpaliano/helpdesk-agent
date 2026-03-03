import { useRef, useEffect, type KeyboardEvent } from 'react';
import type { Message } from '@/types';
import { MessageBubble } from './MessageBubble';

const SUGGESTIONS = [
  { icon: '🔌', text: 'Qual o status dos serviços?' },
  { icon: '🔑', text: 'Erro 401 ao fazer login' },
  { icon: '🔒', text: 'Como faço reset de senha?' },
  { icon: '🪝', text: 'Webhook não está entregando' },
];

interface Props {
  input: string;
  onInputChange: (v: string) => void;
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  error: string | null;
  eventCount: number;
  onSend: () => void;
  onOpenSidebar: () => void;
}

export function ChatLayout({
  input, onInputChange, messages, isLoading, sessionId, error, eventCount, onSend, onOpenSidebar,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0 || isLoading;
  const canSend = input.trim().length > 0 && !!sessionId && !isLoading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  function handleChange(v: string) {
    onInputChange(v);
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full">

        {/* Header — só aparece quando há mensagens */}
        {hasMessages && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
            <span className="text-sm font-medium text-neutral-400">Helpdesk Agent</span>
            <a
              href="http://localhost:3000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              API Docs →
            </a>
          </header>
        )}

        {/* Área de conteúdo */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            /* Landing */
            <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-white mb-2">Como posso ajudar?</h1>
                <p className="text-sm text-neutral-500">Suporte técnico · Status dos serviços · Tickets</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => onInputChange(s.text)}
                    disabled={!sessionId}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 text-xs hover:bg-neutral-800 hover:text-white hover:border-neutral-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="px-6 py-6 space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white shrink-0 mt-0.5">
                    HS
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl py-2.5 px-4">
                  {error}
                </p>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar — sempre no rodapé */}
        <div className="border-t border-neutral-800 bg-neutral-950 px-6 py-4 shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem..."
              disabled={!sessionId || isLoading}
              rows={1}
              className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 rounded-xl px-4 py-3 resize-none outline-none focus:border-neutral-600 transition-colors min-h-[48px] max-h-[200px] disabled:opacity-40 disabled:cursor-not-allowed"
            />

            {/* Ver ações */}
            <button
              onClick={onOpenSidebar}
              className="relative flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl px-4 text-xs transition-all shrink-0 h-12"
            >
              ⚡ Ver Ações
              {eventCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium leading-none">
                  {eventCount > 9 ? '9+' : eventCount}
                </span>
              )}
            </button>

            {/* Enviar */}
            <button
              onClick={onSend}
              disabled={!canSend}
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all text-lg text-white bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed"
            >
              ↑
            </button>
          </div>
          <p className="text-center text-[11px] text-neutral-700 mt-2.5">
            Agente pode cometer erros. Verifique informações importantes.
          </p>
        </div>

      </div>
    </div>
  );
}
