/**
 * Parse Vietnamese money amounts from natural text.
 * Handles: "1tr2", "500k", "1.200.000đ", "1,200,000", "1200000"
 * Returns amount in VND (integer) or null if not found.
 */

const PATTERNS: { regex: RegExp; parser: (m: RegExpMatchArray) => number }[] = [
  // "1tr2" or "1tr" or "1.5tr" or "2tr5"
  {
    regex: /(\d+(?:[.,]\d+)?)\s*tr(?:iệu)?\s*(\d+)?/i,
    parser: (m) => {
      const main = parseFloat(m[1].replace(",", ".")) * 1_000_000;
      const sub = m[2] ? parseInt(m[2]) * 100_000 : 0;
      return main + sub;
    },
  },
  // "500k" or "500K" or "1.5k"
  {
    regex: /(\d+(?:[.,]\d+)?)\s*k\b/i,
    parser: (m) => Math.round(parseFloat(m[1].replace(",", ".")) * 1_000),
  },
  // "1.200.000đ" or "1.200.000 đ" or "1.200.000 VND"
  {
    regex: /(\d{1,3}(?:\.\d{3})+)\s*(?:đ|dong|vnd|vnđ)?/i,
    parser: (m) => parseInt(m[1].replace(/\./g, ""), 10),
  },
  // "1,200,000" (comma-separated thousands)
  {
    regex: /(\d{1,3}(?:,\d{3})+)\s*(?:đ|dong|vnd|vnđ)?/i,
    parser: (m) => parseInt(m[1].replace(/,/g, ""), 10),
  },
  // Plain number >= 1000: "500000", "200000đ"
  {
    regex: /(\d{4,})\s*(?:đ|dong|vnd|vnđ)?/i,
    parser: (m) => parseInt(m[1], 10),
  },
];

export function parseVietnameseAmount(text: string): number | null {
  for (const { regex, parser } of PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const amount = parser(match);
      // Sanity check: Vietnamese amounts are typically 1,000 - 1,000,000,000
      if (amount >= 1000 && amount <= 1_000_000_000) {
        return amount;
      }
    }
  }
  return null;
}

/** Extract all amounts found in text */
export function extractAllAmounts(text: string): number[] {
  const amounts: number[] = [];
  for (const { regex, parser } of PATTERNS) {
    const matches = text.matchAll(new RegExp(regex.source, "gi"));
    for (const match of matches) {
      const amount = parser(match as RegExpMatchArray);
      if (amount >= 1000 && amount <= 1_000_000_000) {
        amounts.push(amount);
      }
    }
  }
  return [...new Set(amounts)];
}
