export interface CountryCode {
  code: string;
  label: string;
}

/** Israel first (launch market); +1 because the Firebase test number is +1 650-555-1234. */
export const COUNTRY_CODES: CountryCode[] = [
  { code: '+972', label: '🇮🇱 +972' },
  { code: '+1', label: '🇺🇸 +1' },
];

/**
 * Turns what the user typed into an E.164 mobile number, or null if it isn't valid.
 * Accepts spaces, dashes and brackets, and the local leading 0 for Israel (050-123-4567).
 */
export function toE164(countryCode: string, input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (countryCode === '+972') {
    const national = digits.replace(/^972/, '').replace(/^0+/, '');
    return /^5\d{8}$/.test(national) ? `+972${national}` : null;
  }
  if (countryCode === '+1') {
    const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    return /^[2-9]\d{9}$/.test(national) ? `+1${national}` : null;
  }
  return null;
}
