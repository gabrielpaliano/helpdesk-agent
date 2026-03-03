import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`[server] Helpdesk Agent running on http://localhost:${PORT}`);
  console.log(`[server] Model: ${process.env.OPENAI_MODEL ?? 'gpt-4o-mini'}`);
});
