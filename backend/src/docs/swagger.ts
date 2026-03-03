// OpenAPI 3.0 spec — servido pelo swagger-ui-express em /docs
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Helpdesk Agent API',
    version: '1.0.0',
    description:
      'Agente de atendimento com roteamento por intenção, chamada de ferramentas (tools), memória por sessão e streaming via SSE.',
  },
  tags: [
    { name: 'Sessions', description: 'Gerenciamento de sessões de conversa' },
    { name: 'Chat', description: 'Interação com o agente' },
  ],
  paths: {
    '/sessions': {
      get: {
        tags: ['Sessions'],
        summary: 'Listar sessões',
        description: 'Retorna todas as sessões que possuem ao menos uma mensagem, ordenadas da mais recente para a mais antiga. Usado pela sidebar de histórico de conversas.',
        responses: {
          200: {
            description: 'Lista de sessões',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      messageCount: { type: 'integer', example: 4 },
                      firstMessage: { type: 'string', nullable: true, example: 'Qual o status dos serviços?' },
                    },
                  },
                },
                example: [
                  {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    createdAt: '2024-01-01T20:00:00Z',
                    messageCount: 4,
                    firstMessage: 'Qual o status dos serviços?',
                  },
                ],
              },
            },
          },
        },
      },
      post: {
        tags: ['Sessions'],
        summary: 'Criar nova sessão',
        description: 'Cria uma sessão de conversa. O sessionId deve ser enviado em todas as chamadas ao /chat.',
        responses: {
          201: {
            description: 'Sessão criada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessionId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/sessions/{sessionId}/messages': {
      get: {
        tags: ['Sessions'],
        summary: 'Histórico da sessão',
        description: 'Retorna todas as mensagens e eventos registrados na sessão.',
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID da sessão criada via POST /sessions',
          },
        ],
        responses: {
          200: {
            description: 'Histórico retornado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessionId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    messages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          role: { type: 'string', enum: ['user', 'assistant'] },
                          content: { type: 'string' },
                          timestamp: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    events: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AgentEvent' },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Sessão não encontrada' },
        },
      },
    },
    '/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Enviar mensagem ao agente',
        description: `Envia uma mensagem e recebe a resposta do agente.

**Modo JSON (padrão):** retorna todos os eventos de uma vez ao final.

**Modo SSE (streaming):** envie o header \`Accept: text/event-stream\` para receber eventos em tempo real conforme o agente processa.`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId', 'message'],
                properties: {
                  sessionId: { type: 'string', format: 'uuid' },
                  message: { type: 'string', example: 'Qual o status dos serviços?' },
                  metadata: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string', example: 'u-123' },
                      channel: { type: 'string', enum: ['web', 'whatsapp', 'email'], example: 'web' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resposta do agente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessionId: { type: 'string' },
                    assistantMessage: { type: 'string' },
                    events: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AgentEvent' },
                    },
                  },
                },
                example: {
                  sessionId: '550e8400-e29b-41d4-a716-446655440000',
                  assistantMessage: 'API está ok. Webhook está degradado.',
                  events: [
                    { type: 'thought', name: 'router', data: { intent: 'STATUS' }, timestamp: '2024-01-01T00:00:00Z' },
                    { type: 'tool_call', name: 'get_service_status', data: { input: {} }, timestamp: '2024-01-01T00:00:01Z' },
                    { type: 'tool_result', name: 'get_service_status', data: { output: { api: 'ok', webhook: 'degraded', dashboard: 'ok' } }, timestamp: '2024-01-01T00:00:02Z' },
                  ],
                },
              },
              'text/event-stream': {
                schema: { type: 'string' },
                example: 'data: {"type":"thought","name":"router","data":{"intent":"STATUS"}}\n\ndata: [DONE]\n\n',
              },
            },
          },
          400: { description: 'sessionId ou message ausente' },
          404: { description: 'Sessão não encontrada' },
          429: { description: 'Rate limit excedido para essa sessão' },
        },
      },
    },
  },
  components: {
    schemas: {
      AgentEvent: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['thought', 'tool_call', 'tool_result'] },
          name: { type: 'string', example: 'get_service_status' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
