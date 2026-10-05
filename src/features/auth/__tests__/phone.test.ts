import { toE164 } from '../phone';

describe('toE164', () => {
  it.each([
    ['050-123-4567', '+972501234567'],
    ['0501234567', '+972501234567'],
    ['50 123 4567', '+972501234567'],
    ['+972 50-123-4567', '+972501234567'],
    ['972501234567', '+972501234567'],
  ])('Israel: %s → %s', (input, expected) => {
    expect(toE164('+972', input)).toBe(expected);
  });

  it.each(['03-123-4567', '050-123', '0501234567890', ''])('Israel rejects %s', (input) => {
    expect(toE164('+972', input)).toBeNull();
  });

  it.each([
    ['650-555-1234', '+16505551234'],
    ['(650) 555 1234', '+16505551234'],
    ['1 650 555 1234', '+16505551234'],
  ])('US/Canada: %s → %s', (input, expected) => {
    expect(toE164('+1', input)).toBe(expected);
  });

  it('rejects unknown country codes and short US numbers', () => {
    expect(toE164('+1', '555-1234')).toBeNull();
    expect(toE164('+44', '07700900123')).toBeNull();
  });
});
