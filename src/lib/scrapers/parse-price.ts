// Pulls the first "1,234.56"-shaped number out of scraped text, ignoring
// currency symbols/labels like "Rs." or "Starting" that can otherwise leak
// a stray decimal point into a naive digit-only strip.
export function parsePrice(text: string): number | null {
  const match = text.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(num) && num > 0 ? num : null;
}
