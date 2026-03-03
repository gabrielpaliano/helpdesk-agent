// ────────────────────────────────────────────────────────────
// Tool implementations — these are "real" functions (not mocks).
// All data returned here is the source of truth for the agent.
// The LLM must NEVER invent data that should come from these.
// ────────────────────────────────────────────────────────────

// --- search_kb --------------------------------------------------

const KB_ARTICLES = [
  {
    title: 'Como resolver erro 401 no login',
    summary:
      'Erro 401 indica token inválido ou expirado. Faça logout e login novamente. Se persistir, verifique se a conta está bloqueada no painel de admin.',
    keywords: ['401', 'login', 'token', 'autenticação', 'unauthorized', 'auth'],
  },
  {
    title: 'Reset de senha',
    summary:
      'Acesse a página de login e clique em "Esqueci minha senha". Você receberá um email em até 5 minutos. Verifique o spam se não encontrar.',
    keywords: ['senha', 'password', 'reset', 'forgot', 'esqueci', 'redefinir'],
  },
  {
    title: 'Webhooks não estão sendo entregues',
    summary:
      'Verifique se a URL de destino responde com 2xx em até 5 segundos. Tentativas com falha são retentadas 3 vezes com backoff exponencial. Confira os logs em Settings > Webhooks.',
    keywords: ['webhook', 'entrega', 'delivery', 'callback', 'endpoint'],
  },
  {
    title: 'Como acessar o dashboard de métricas',
    summary:
      'O dashboard está em app.plataforma.com/metrics. Requer permissão de Admin ou Viewer. Se não conseguir acessar, peça ao admin da sua conta para revisar suas permissões.',
    keywords: ['dashboard', 'métricas', 'metrics', 'analytics', 'permissão', 'acesso'],
  },
  {
    title: 'Limites de rate limit da API',
    summary:
      'O plano Free permite 100 req/min. O plano Pro permite 1000 req/min. Se estiver recebendo 429, adicione retry com backoff exponencial na sua integração.',
    keywords: ['rate limit', '429', 'too many requests', 'limite', 'quota', 'api'],
  },
];

// Simple keyword search — good enough for this context.
// A real KB would use embeddings + vector search.
export function searchKb(query: string): Array<{ title: string; summary: string }> {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/);

  const scored = KB_ARTICLES.map((article) => {
    const keywordHits = article.keywords.filter((k) => lower.includes(k)).length;
    const titleHits = words.filter((w) => w.length > 3 && article.title.toLowerCase().includes(w)).length;
    return { article, score: keywordHits * 2 + titleHits };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ article }) => ({ title: article.title, summary: article.summary }));
}

// --- get_service_status -----------------------------------------

export type ServiceHealth = 'ok' | 'degraded' | 'down';

export interface ServiceStatus {
  api: ServiceHealth;
  webhook: ServiceHealth;
  dashboard: ServiceHealth;
}

// Simulated status. In production this would call a status API or healthcheck endpoints.
// Keeping it mostly stable so tests are predictable.
let currentStatus: ServiceStatus = {
  api: 'ok',
  webhook: 'degraded', // simulating a mild incident
  dashboard: 'ok',
};

export function getServiceStatus(): ServiceStatus {
  return { ...currentStatus };
}

// Exposed for testing purposes
export function _setServiceStatus(status: Partial<ServiceStatus>): void {
  currentStatus = { ...currentStatus, ...status };
}

// --- create_ticket ----------------------------------------------

interface TicketInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  contact: string;
}

let ticketCounter = 10000;

export function createTicket(input: TicketInput): { ticketId: string } {
  ticketCounter += 1;
  // Log to stdout so it shows in Docker logs — basic observability
  console.log(`[ticket created] TCK-${ticketCounter}`, JSON.stringify(input));
  return { ticketId: `TCK-${ticketCounter}` };
}

// --- Tool dispatcher --------------------------------------------
// Central place to call tools by name (used in the agent loop)

export function executeTool(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'search_kb':
      return searchKb(args.query as string);
    case 'get_service_status':
      return getServiceStatus();
    case 'create_ticket':
      return createTicket(args as unknown as TicketInput);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
