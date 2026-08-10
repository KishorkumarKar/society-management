/**
 * Minimal duration-string parser ("30d", "15m", "1h", "3600000") so we don't
 * need an extra dependency just for computing refresh_tokens.expires_at.
 */
const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export default function ms(input: string): number {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/i);
  if (!match) {
    throw new Error(`Unrecognized duration format: "${input}"`);
  }
  const [, value, unit] = match;
  return Math.round(parseFloat(value) * UNIT_MS[unit.toLowerCase()]);
}
