/**
 * Parse Vietnamese bank transfer screenshot OCR text.
 * Extracts amount, recipient name, date, and transaction content.
 */

export interface OcrParseResult {
  amount: number | null;
  recipientName: string | null;
  date: string | null;
  content: string | null;
  rawText: string;
  confidence: number;
}

// Amount patterns: "500.000", "500,000", "500000", with optional "VND"/"đ"
const AMOUNT_PATTERNS = [
  /(?:s[ôo]́?\s*ti[eê]̀?n|amount|gi[aá]\s*tr[ịi])[:\s]*([0-9.,]+)\s*(?:VND|đ|dong)?/i,
  /([0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:VND|đ|dong)/i,
  /(?:VND|đ)\s*([0-9]{1,3}(?:[.,][0-9]{3})+)/i,
];

// Recipient patterns
const RECIPIENT_PATTERNS = [
  /(?:ng[ưu][ờo]̀?i\s*nh[aậ]̣?n|to|recipient|t[eê]n\s*TK)[:\s]*([A-Z\s]{3,})/i,
  /(?:chuy[eê]̉?n\s*(?:đ[eê]́?n|t[ớo]i))[:\s]*([A-Z\s]{3,})/i,
];

// Date patterns
const DATE_PATTERNS = [
  /(\d{2}[/-]\d{2}[/-]\d{4})/,
  /(\d{2}[/-]\d{2}[/-]\d{2})\b/,
  /(\d{4}[/-]\d{2}[/-]\d{2})/,
];

// Content/description patterns
const CONTENT_PATTERNS = [
  /(?:n[oộ]̣?i\s*dung|content|memo|ghi\s*ch[uú])[:\s]*(.+)/i,
  /(?:GOCHI\s+[A-Z0-9]+\s+[A-Z]+)/i,
];

function parseAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1] ?? match[0];
      const cleaned = raw.replace(/[.,]/g, "").replace(/\D/g, "");
      const num = parseInt(cleaned, 10);
      // Vietnamese bank transfers are typically 1,000 - 100,000,000 VND
      if (num >= 1000 && num <= 100_000_000) return num;
    }
  }

  // Fallback: find the largest number that looks like VND
  const allNumbers = text.match(/[0-9]{1,3}(?:[.,][0-9]{3})+/g) ?? [];
  const parsed = allNumbers
    .map((n) => parseInt(n.replace(/[.,]/g, ""), 10))
    .filter((n) => n >= 1000 && n <= 100_000_000)
    .sort((a, b) => b - a);

  return parsed[0] ?? null;
}

function parseRecipient(text: string): string | null {
  for (const pattern of RECIPIENT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function parseDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function parseContent(text: string): string | null {
  for (const pattern of CONTENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) return (match[1] ?? match[0]).trim();
  }
  return null;
}

export function parseTransferScreenshot(
  ocrText: string,
  ocrConfidence: number
): OcrParseResult {
  const text = ocrText.replace(/\n+/g, " ").replace(/\s+/g, " ");

  return {
    amount: parseAmount(text),
    recipientName: parseRecipient(text),
    date: parseDate(text),
    content: parseContent(text),
    rawText: ocrText,
    confidence: ocrConfidence,
  };
}

/** Check if OCR result matches expected debt */
export function matchesDebt(
  ocrResult: OcrParseResult,
  expectedAmount: number,
  tolerance: number = 1000
): { matches: boolean; reason: string } {
  if (!ocrResult.amount) {
    return { matches: false, reason: "Không đọc được số tiền từ ảnh" };
  }

  const diff = Math.abs(ocrResult.amount - expectedAmount);
  if (diff > tolerance) {
    return {
      matches: false,
      reason: `Số tiền không khớp: OCR đọc ${ocrResult.amount.toLocaleString("vi-VN")}đ, cần ${expectedAmount.toLocaleString("vi-VN")}đ`,
    };
  }

  return { matches: true, reason: "Số tiền khớp" };
}
