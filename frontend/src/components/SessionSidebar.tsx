import { useEffect, useState } from 'react';
import { SquarePen, MessageSquare } from 'lucide-react';
import type { SessionSummary } from '@/types';

const C = {
  bg:          '#070b12',
  border:      'rgba(255,255,255,0.06)',
  text:        '#e6edf4',
  textSub:     '#8a97a8',
  muted:       '#4a5568',
  hover:       'rgba(255,255,255,0.04)',
  active:      'rgba(255,255,255,0.08)',
} as const;

interface Props {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  refreshKey: number;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function truncate(text: string, max = 44): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

export function SessionSidebar({ currentSessionId, onSelectSession, onNewSession, refreshKey }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    fetch('/sessions')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [refreshKey, currentSessionId]);

  return (
    <div style={{
      width: '252px',
      flexShrink: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: C.bg,
      borderRight: `1px solid ${C.border}`,
    }}>

      {/* Header */}
      <div style={{
        padding: '1rem 0.875rem 0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Helpdesk
        </span>

        <button
          onClick={onNewSession}
          title="Nova conversa"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: C.textSub,
            padding: '0.375rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.text;
            e.currentTarget.style.background = C.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.textSub;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <SquarePen size={15} />
        </button>
      </div>

      {/* Sessions list */}
      <div className="scroll-area" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0.5rem' }}>
        {sessions.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: C.muted,
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          }}>
            Nenhuma conversa ainda.<br />Envie uma mensagem para começar.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === currentSessionId;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isActive ? C.active : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  marginBottom: '0.125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = C.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive ? C.active : 'transparent';
                }}
              >
                {/* Title */}
                <span style={{
                  fontSize: '0.8125rem',
                  color: isActive ? C.text : '#b0bac8',
                  fontWeight: isActive ? 500 : 400,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}>
                  {s.firstMessage ? truncate(s.firstMessage) : 'Conversa sem título'}
                </span>

                {/* Meta */}
                <span style={{
                  fontSize: '0.6875rem',
                  color: C.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  {formatDate(s.createdAt)}
                  <span>·</span>
                  <MessageSquare size={10} />
                  {s.messageCount}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
