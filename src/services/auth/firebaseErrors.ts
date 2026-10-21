import { AuthError } from './AuthService';

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
  'auth/code-expired': 'That code has expired. Tap "Change number" and send a new one.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
};

/** Logs the real cause (for developers) and rethrows it as a user-facing AuthError when we know it. */
export function toAuthError(error: unknown): unknown {
  const code = (error as { code?: unknown } | null)?.code;
  console.warn('Firebase sign-in failed', error);
  return typeof code === 'string' && MESSAGES[code] ? new AuthError(MESSAGES[code], code) : error;
}
