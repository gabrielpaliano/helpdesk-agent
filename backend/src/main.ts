import 'dotenv/config';
import app from './app';
import { initDb } from './agent/memory.store';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] Helpdesk Agent running on http://localhost:${PORT}`);
      console.log(`[server] Model: ${process.env.OPENAI_MODEL ?? 'gpt-4o-mini'}`);
    });
  })
  .catch((err) => {
    console.error('[startup] Database init failed:', err);
    process.exit(1);
  });
