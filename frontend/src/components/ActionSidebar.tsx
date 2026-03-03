import type { AgentEvent } from '@/types';

// ── Design tokens (same palette as Chat.tsx) ─────────────────
const C = {
  bg:         '#0e1521',
  bgElevated: '#131b2b',
  bgCode:     '#0c111d',
  border:     'rgba(255,255,255,0.08)',
  text:       '#e6edf4',
  muted:      '#5a6478',
} as const;

const EVENT_STYLE: Record<AgentEvent['type'], { label: string; color: string; bg: string; border: string }> = {
  thought:     { label: 'Raciocínio', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
  tool_call:   { label: 'Tool',       color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)'  },
  tool_result: { label: 'Resultado',  color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)'  },
};

function EventCard({ event }: { event: AgentEvent }) {
  const s = EVENT_STYLE[event.type];
  const time = new Date(event.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div style={{
      backgroundColor: C.bgElevated,
      border: `1px solid ${C.border}`,
      borderRadius: '0.625rem',
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontSize: '10px', fontWeight: 600,
          padding: '2px 7px', borderRadius: '9999px',
          color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}`,
          flexShrink: 0, letterSpacing: '0.02em',
        }}>
          {s.label}
        </span>
        <span style={{
          fontSize: '11px', color: C.muted,
          fontFamily: 'monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {event.name}
        </span>
        <span style={{ fontSize: '10px', color: C.muted, flexShrink: 0 }}>
          {time}
        </span>
      </div>

      {/* JSON data */}
      <pre style={{
        fontSize: '10px', color: C.muted,
        backgroundColor: C.bgCode,
        borderRadius: '0.375rem',
        padding: '0.5rem 0.625rem',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontFamily: 'ui-monospace, monospace',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {JSON.stringify(event.data, null, 2)}
      </pre>
    </div>
  );
}

export function ActionSidebar({ events }: { events: AgentEvent[] }) {
  return (
    <div style={{
      width: '320px',
      flexShrink: 0,
      height: '100%',
      borderLeft: `1px solid ${C.border}`,
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: C.text }}>
          Ações do Agente
        </span>
        {events.length > 0 && (
          <span style={{
            fontSize: '11px', color: C.muted,
            backgroundColor: C.bgElevated,
            padding: '2px 8px', borderRadius: '9999px',
            border: `1px solid ${C.border}`,
          }}>
            {events.length}
          </span>
        )}
      </div>

      {/* Event list */}
      <div
        className="scroll-area"
        style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          padding: '0.875rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}
      >
        {events.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '0.5rem', color: C.muted,
          }}>
            <span style={{ fontSize: '1.5rem', opacity: 0.25 }}>⚡</span>
            <span style={{ fontSize: '0.8125rem' }}>Aguardando ações...</span>
          </div>
        ) : (
          events.map((e, i) => <EventCard key={i} event={e} />)
        )}
      </div>
    </div>
  );
}
