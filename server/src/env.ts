import type { AuthUser } from './auth/verifier.js';
import type { Stores } from './stores/index.js';

/**
 * Hono environment shared by all routes. `user` is set by `requireAuth`, which guards every route that
 * reads it (`/v1/*`, `/photos/*`).
 */
export type AppEnv = { Variables: { stores: Stores; user: AuthUser } };
