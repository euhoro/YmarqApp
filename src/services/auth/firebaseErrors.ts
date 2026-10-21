import { AuthError } from './AuthService';

/** Problems on our side (setup, billing): the user can only wait, so the code is shown for support. */
const UNAVAILABLE = 'Sign-in by SMS is temporarily unavailable. Please try again later.';

/** Firebase error codes → what the user can do about it. Unknown codes keep the screen's default text. */
const MESSAGES: Record<string, string> = {
  'auth/invalid-phone-number': 'That phone number is not valid. Check it and try again.',
  'auth/missing-phone-number': 'Enter your phone number first.',
  'auth/operation-not-allowed':
    "Sign-in by SMS isn't available for this country yet. Please try again later.",
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/quota-exceeded': "We can't send more codes right now. Please try again later.",
  'auth/captcha-check-failed': "The robot check didn't pass. Try again.",
  'auth/invalid-verification-code': 'Wrong code. Check the SMS and try again.',
  'auth/missing-verification-code': 'Enter the code from the SMS.',
  'auth/code-expired': 'That code has expired. Tap "Change number" and send a new one.',
  'auth/session-expired': 'That code has expired. Tap "Change number" and send a new one.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/user-disabled':
    'This account has been blocked. Contact support if you think this is a mistake.',
};

/** Codes that mean Ymarq's Firebase setup is wrong, not the user's input. */
const SETUP_CODES = new Set([
  'auth/billing-not-enabled',
  'auth/invalid-app-credential',
  'auth/missing-app-credential',
  'auth/missing-client-identifier',
  'auth/app-not-authorized',
  'auth/unauthorized-domain',
  'auth/invalid-api-key',
  'auth/internal-error',
]);

/**
 * Logs the real cause (for developers) and rethrows it as a user-facing AuthError when we know it.
 * Unknown errors pass through unchanged; the screen shows its own text plus their code.
 */
export function toAuthError(error: unknown): unknown {
  const code = (error as { code?: unknown } | null)?.code;
  console.warn('Firebase sign-in failed', error);
  if (typeof code !== 'string') return error;
  if (MESSAGES[code]) return new AuthError(MESSAGES[code], code);
  if (SETUP_CODES.has(code)) return new AuthError(`${UNAVAILABLE} (${code})`, code);
  return error;
}
