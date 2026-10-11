import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { AuthUser, TokenVerifier } from './verifier.js';

export type AuthVariables = { user: AuthUser };

/**
 * Rejects requests without a valid `Authorization: Bearer <token>` (401 JSON) and exposes the
 * caller as `c.get('user')`.
 */
export function requireAuth(verify: TokenVerifier) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HTTPException(401, { message: 'Sign in required' });
    }
    try {
      c.set('user', await verify(token));
    } catch {
      throw new HTTPException(401, { message: 'Invalid or expired sign-in' });
    }
    await next();
  });
}
