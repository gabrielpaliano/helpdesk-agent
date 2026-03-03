import { useRef, useEffect, type KeyboardEvent } from 'react';
import { ArrowRight, Square, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import type { Message } from '@/types';

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:         '#0c111d',
  bgElevated: '#131b2b',
  border:     'rgba(255,255,255,0.08)',
  borderHover:'rgba(255,255,255,0.15)',
  text:       '#e6edf4',
  muted:      '#5a6478',
  userPill:   '#1e2a3d',
  btnBg:      '#2a3447',
  btnHover:   '#334059',
} as const;

interface Props {
  input: string;
  onInputChange: (v: string) => void;
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  error: string | null;
  onSend: () => void;
  onStop: () => void;
}

// ── Input box (shared between landing and chat) ──────────────
function InputBox({
  input, onInputChange, onSend, onStop, sessionId, isLoading, large = false,
}: {
  input: string; onInputChange: (v: string) => void;
  onSend: () => void; onStop: () => void;
  sessionId: string | null; isLoading: boolean; large?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = input.trim().length > 0 && !!sessionId && !isLoading;

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
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div style={{
      backgroundColor: C.bgElevated,
      border: `1px solid ${C.border}`,
      borderRadius: '1rem',
      padding: large ? '1.25rem 1.25rem 1rem' : '1rem 1rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Mensagem..."
        disabled={!sessionId || isLoading}
        rows={1}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: C.text,
          fontSize: large ? '1rem' : '0.9375rem',
          lineHeight: '1.6',
          resize: 'none',
          width: '100%',
          minHeight: large ? '56px' : '40px',
          maxHeight: '160px',
          opacity: !sessionId ? 0.5 : 1,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isLoading ? (
          <button
            onClick={onStop}
            style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              backgroundColor: C.btnBg,
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.text,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.btnHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.btnBg)}
          >
            <Square size={14} fill={C.text} strokeWidth={0} />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!canSend}
            style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              backgroundColor: canSend ? C.btnBg : 'rgba(42,52,71,0.4)',
              border: 'none',
              cursor: canSend ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: canSend ? C.text : C.muted,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (canSend) e.currentTarget.style.backgroundColor = C.btnHover; }}
            onMouseLeave={(e) => { if (canSend) e.currentTarget.style.backgroundColor = C.btnBg; }}
          >
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Chat component ───────────────────────────────────────────
export function Chat({ input, onInputChange, messages, isLoading, sessionId, error, onSend, onStop }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0 || isLoading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Landing view ─────────────────────────────────────────
  if (!hasMessages) {
    return (
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1.5rem',
        gap: '2rem',
      }}>
        <h1 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 400,
          color: C.text,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          Como posso ajudar?
        </h1>

        <div style={{ width: '100%', maxWidth: '680px' }}>
          <InputBox
            input={input}
            onInputChange={onInputChange}
            onSend={onSend}
            onStop={onStop}
            sessionId={sessionId}
            isLoading={isLoading}
            large
          />
        </div>
      </div>
    );
  }

  // ── Chat view ────────────────────────────────────────────
  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Messages */}
      <div className="scroll-area" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 1rem' }}>

          {messages.map((msg, i) => (
            msg.role === 'user'
              ? (
                /* User message — right-aligned pill */
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <span style={{
                    backgroundColor: C.userPill,
                    color: C.text,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.875rem',
                    fontSize: '0.9375rem',
                    lineHeight: 1.5,
                    maxWidth: '75%',
                    display: 'inline-block',
                    border: `1px solid ${C.border}`,
                  }}>
                    {msg.content}
                  </span>
                </div>
              )
              : (
                /* Bot message — plain text, no bubble */
                <div key={i} style={{ marginBottom: '1.75rem' }}>
                  <p style={{
                    color: C.text,
                    fontSize: '0.9375rem',
                    lineHeight: 1.75,
                  }}>
                    {msg.content}
                  </p>
                  {/* Thumbs */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                    <button style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: C.muted, padding: '0.25rem', borderRadius: '0.375rem',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <button style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: C.muted, padding: '0.25rem', borderRadius: '0.375rem',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                    >
                      <ThumbsDown size={15} />
                    </button>
                  </div>
                </div>
              )
          ))}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="thinking-pulse" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: C.muted,
              marginBottom: '1.5rem',
            }}>
              <Sparkles size={14} />
              <span style={{ fontSize: '0.9rem' }}>Pensando...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{
              color: '#f87171',
              fontSize: '0.875rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239,68,68,0.2)',
              marginBottom: '1rem',
            }}>
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '0 1.5rem 1.5rem', flexShrink: 0 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <InputBox
            input={input}
            onInputChange={onInputChange}
            onSend={onSend}
            onStop={onStop}
            sessionId={sessionId}
            isLoading={isLoading}
          />
        </div>
      </div>

    </div>
  );
}
