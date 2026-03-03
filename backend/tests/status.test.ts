/**
 * Teste de integração — Fluxo STATUS
 *
 * O que validamos:
 * 1. POST /sessions cria sessão com ID
 * 2. POST /chat classifica intent como STATUS
 * 3. O agent chama get_service_status (tool_call event)
 * 4. O evento tool_result contém os campos corretos
 * 5. A resposta final inclui o events array
 */

// jest.mock() é hoisted pelo Jest para antes de qualquer import.
// Isso substitui o módulo inteiro, então o construtor real do OpenAI nunca roda.
jest.mock('../src/lib/openai.client', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  OPENAI_MODEL: 'gpt-4o-mini',
}));

import request from 'supertest';
import { openai } from '../src/lib/openai.client';
import app from '../src/app';

const mockCreate = openai.chat.completions.create as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /chat — STATUS intent', () => {
  it('should call get_service_status and return tool events', async () => {
    // Criar sessão
    const sessionRes = await request(app).post('/sessions').expect(201);
    const { sessionId } = sessionRes.body as { sessionId: string };

    // Configurar mocks na ordem em que serão chamados:
    // 1ª chamada: classificação de intent (retorna JSON com intent)
    // 2ª chamada: loop principal — model decide chamar get_service_status
    // 3ª chamada: loop principal — model recebe resultado e dá resposta final
    mockCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: '{"intent":"STATUS"}' },
            finish_reason: 'stop',
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_status_1',
                  type: 'function',
                  function: { name: 'get_service_status', arguments: '{}' },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                'API está operacional. Webhook está com degradação parcial. Dashboard está ok.',
            },
            finish_reason: 'stop',
          },
        ],
      });

    const chatRes = await request(app)
      .post('/chat')
      .send({ sessionId, message: 'Como está o status dos serviços?' })
      .expect(200);

    const body = chatRes.body as {
      sessionId: string;
      assistantMessage: string;
      events: Array<{ type: string; name: string; data: Record<string, unknown> }>;
    };

    // Deve ter sessionId na resposta
    expect(body.sessionId).toBe(sessionId);

    // Deve ter uma resposta não vazia
    expect(body.assistantMessage).toBeTruthy();

    // Deve ter pelo menos 3 eventos: thought + tool_call + tool_result
    expect(body.events.length).toBeGreaterThanOrEqual(3);

    // Verificar evento "thought" com intent STATUS
    const thought = body.events.find((e) => e.type === 'thought' && e.name === 'router');
    expect(thought).toBeDefined();
    expect(thought?.data.intent).toBe('STATUS');

    // Verificar que get_service_status foi chamado
    const toolCall = body.events.find((e) => e.type === 'tool_call' && e.name === 'get_service_status');
    expect(toolCall).toBeDefined();

    // Verificar que o resultado da tool tem os campos esperados
    const toolResult = body.events.find((e) => e.type === 'tool_result' && e.name === 'get_service_status');
    expect(toolResult).toBeDefined();
    const output = toolResult?.data.output as Record<string, string>;
    expect(output).toHaveProperty('api');
    expect(output).toHaveProperty('webhook');
    expect(output).toHaveProperty('dashboard');
    expect(['ok', 'degraded', 'down']).toContain(output.api);
  });
});
