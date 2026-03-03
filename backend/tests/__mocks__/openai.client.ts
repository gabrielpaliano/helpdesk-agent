// Mock do cliente OpenAI para os testes.
// Usamos jest.fn() para que cada teste possa configurar
// as respostas exatas que espera receber da API.

export const openai = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

export const OPENAI_MODEL = 'gpt-4o-mini';
