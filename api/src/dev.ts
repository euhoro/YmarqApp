// Local development server: `npm run dev` → http://localhost:3001
import { serve } from '@hono/node-server';

import app from './index.js';

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, () => console.log(`Ymarq API on http://localhost:${port}`));
