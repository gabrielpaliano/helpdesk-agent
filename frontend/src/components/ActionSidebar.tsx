import { useEffect, useState } from 'react';
import type { AgentEvent } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  events: AgentEvent[];
}

const EVENT_CONFIG = {
  thought:     { icon: '💭', label: 'Roteamento',   color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  tool_call:   { icon: '🔧', label: 'Tool chamada', color: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  tool_result: { icon: '✅', label: 'Resultado',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
} as const;

function EventCard({ event }: { event: AgentEvent }) {
  const c = EVENT_CONFIG[event.type];
  const time = new Date(event.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="border border-neutral-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{c.icon}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${c.color}`}>
          {c.label}
        </span>
        <span className="text-[11px] text-neutral-400 font-mono truncate flex-1">{event.name}</span>
        <span className="text-[10px] text-neutral-600 shrink-0">{time}</span>
      </div>
      <pre className="text-[11px] text-neutral-400 bg-neutral-950 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
        {JSON.stringify(event.data, null, 2)}
      </pre>
    </div>
  );
}

export function ActionSidebar({ open, onClose, events }: Props) {
  const [mounted, setMounted] = useState(false);

  // Monta no DOM quando aberto pela primeira vez, nunca desmonta
  // (preserva scroll e evita layout shift)
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 h-screen w-96 max-w-full bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col transition-transform duration-200"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Ações do Agente</h2>
            <p className="text-xs text-neutral-500 mt-0.5">O que o agente fez para responder</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {events.length > 0 && (
              <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                {events.length} evento{events.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Events */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <span className="text-4xl opacity-30">🤖</span>
              <p className="text-sm font-medium text-neutral-500">Nenhuma ação ainda</p>
              <p className="text-xs text-neutral-600">Envie uma mensagem para ver o agente em ação</p>
            </div>
          ) : (
            events.map((e, i) => <EventCard key={i} event={e} />)
          )}
        </div>
      </div>
    </>
  );
}
