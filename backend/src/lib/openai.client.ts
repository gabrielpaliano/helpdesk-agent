import OpenAI from 'openai';

// Singleton client — instanciado uma vez e reaproveitado.
// Separar em arquivo próprio facilita o mock nos testes.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
