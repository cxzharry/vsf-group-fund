/**
 * AI Intent Parser — detects bill creation intent from Vietnamese chat messages.
 * Uses local regex first (fast), falls back to LLM only when needed.
 */
import { parseVietnameseAmount, extractAllAmounts } from "./parse-vietnamese-amount";
import type { ParsedBillIntent, FollowUpQuestion } from "./ai-intent-types";
import { isReadyToConfirm } from "./ai-intent-types";

// Transfer intent keywords
const TRANSFER_PATTERNS = [
  /(\w+)\s+chuyển\s+(?:cho|tiền)\s+(\w+)/i,
  /(\w+)\s+trả\s+(?:cho|tiền)\s+(\w+)/i,
  /chuyển\s+(?:cho|tiền)\s+(\w+)/i,
  /trả\s+(?:cho|tiền)\s+(\w+)/i,
];

// Non-intent messages (greetings, confirmations, etc.)
const NOISE_PATTERNS = [
  /^(ok|okay|oke|ừ|uh|uhm|à|vâng|dạ|hi|hello|hey|chào|bye|tạm biệt|👍|👌|😂|🤣|haha|hihi)$/i,
  /^.{0,3}$/,  // Very short messages
];

// People count patterns
const PEOPLE_PATTERNS = [
  /(\d+)\s*(?:người|ng|ngừ?ời)/i,
  /cả\s*team/i,
  /tất\s*cả/i,
];

// Description extraction — common food/activity words (with and without diacritics)
const DESC_PATTERNS = [
  /(?:ăn|đi)\s+([\p{L}\s]+?)(?:\s+\d|\s*$)/iu,
  /(phở|pho|bún|bun|cơm|com|bánh|banh|pizza|cafe|cà phê|ca phe|trà|tra|bia|lẩu|lau|nướng|nuong|sushi|gà|ga|bò|bo|heo|tôm|tom|cua|mì|mi|xôi|xoi|bắp|bap|ốc|oc)/i,
];

/** Parse a chat message locally (no LLM) */
export function parseIntentLocal(message: string): ParsedBillIntent {
  const trimmed = message.trim();

  // Check for noise/non-intent messages
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return noIntent();
    }
  }

  const amount = parseVietnameseAmount(trimmed);

  // Check transfer intent
  for (const pattern of TRANSFER_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const transferTo = match[2] ?? match[1];
      return buildResult({
        hasIntent: true,
        intentType: "transfer",
        amount,
        transferTo,
        description: null,
      });
    }
  }

  // No amount found — can't be a bill intent
  if (amount === null) {
    return noIntent();
  }

  // Has amount — likely bill intent
  let peopleCount: number | null = null;
  for (const pattern of PEOPLE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      if (/cả\s*team|tất\s*cả/i.test(match[0])) {
        peopleCount = -1; // -1 = "cả team" (resolve to group size later)
      } else {
        peopleCount = parseInt(match[1], 10);
      }
      break;
    }
  }

  // Extract description
  let description: string | null = null;
  for (const pattern of DESC_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      description = match[1]?.trim() ?? match[0]?.trim();
      break;
    }
  }

  // Fallback: extract words between amount token and people count token
  // e.g. "280k bun bo 3 nguoi" → "bun bo"
  if (!description) {
    // Strip amount token (e.g. "280k", "1tr2")
    const withoutAmount = trimmed
      .replace(/\d+(?:[.,]\d+)?\s*(?:tr(?:iệu)?|k)\s*\d*/i, "")
      .replace(/\d{4,}\s*(?:đ|dong|vnd|vnđ)?/i, "")
      .trim();
    // Strip people count token
    const withoutPeople = withoutAmount
      .replace(/\d+\s*(?:người|ng|ngừ?ời)/i, "")
      .replace(/cả\s*team|tất\s*cả/i, "")
      .trim();
    if (withoutPeople.length > 0) {
      description = withoutPeople;
    }
  }

  // Determine split type
  let splitType: "equal" | "custom" | "open" | null = null;
  if (peopleCount !== null && peopleCount > 0) {
    splitType = "equal";
  } else if (peopleCount === -1) {
    splitType = "equal"; // cả team = equal
  }
  // If no people count mentioned → will ask follow-up

  const result = buildResult({
    hasIntent: true,
    intentType: "split",
    amount,
    description,
    peopleCount: peopleCount === -1 ? null : peopleCount,
    splitType,
  });

  // Generate follow-up if not ready to confirm
  if (!isReadyToConfirm(result)) {
    result.followUp = generateFollowUp(result);
  } else if (result.splitType === null) {
    // Has amount + intent but no split info → ask
    result.readyToConfirm = false;
    result.followUp = generateSplitFollowUp(result);
  }

  // Confidence scoring: 0.4 base + description match (+0.25) + people count (+0.2) + split inferred (+0.15)
  let conf = 0.4;
  if (result.description) conf += 0.25;
  if (result.peopleCount !== null) conf += 0.2;
  if (result.splitType !== null) conf += 0.15;
  result.confidence = Math.min(1, conf);

  // Multi-item: if 2+ distinct amounts found → surface alternates
  const allAmounts = extractAllAmounts(trimmed);
  if (allAmounts.length > 1) {
    result.alternates = allAmounts
      .filter((a) => a !== result.amount)
      .slice(0, 3)
      .map((a) => ({ amount: a, description: result.description }));
  }

  return result;
}

function generateFollowUp(parsed: ParsedBillIntent): FollowUpQuestion | null {
  if (parsed.amount === null) {
    return {
      question: "Bao nhiêu tiền?",
      options: [],
    };
  }
  return generateSplitFollowUp(parsed);
}

function generateSplitFollowUp(
  parsed: ParsedBillIntent
): FollowUpQuestion {
  const amtStr = parsed.amount
    ? `${(parsed.amount / 1000).toLocaleString("vi-VN")}k`
    : "";
  const desc = parsed.description?.trim();

  // When description is missing, ask for it first (user can still chat-edit)
  const questionLead = desc
    ? `Chia ${amtStr} cho ${desc}.`
    : `Chia ${amtStr}. Chi tiêu cho gì? Bạn có thể chọn cách chia bên dưới hoặc gõ lại chi tiết hơn.`;

  return {
    question: `${questionLead}\nBạn muốn chia như nào?`,
    options: [
      {
        label: "A",
        value: "open",
        description: "Chia đều · chưa biết mấy người",
      },
      {
        label: "B",
        value: "equal_ask",
        description: "Chia đều · nhập số người",
      },
      {
        label: "C",
        value: "custom",
        description: "Chia tuỳ chỉnh",
      },
    ],
  };
}

function noIntent(): ParsedBillIntent {
  return {
    hasIntent: false,
    intentType: "unknown",
    amount: null,
    description: null,
    peopleCount: null,
    peopleNames: [],
    splitType: null,
    transferTo: null,
    readyToConfirm: false,
    followUp: null,
  };
}

function buildResult(
  overrides: Partial<ParsedBillIntent>
): ParsedBillIntent {
  const result: ParsedBillIntent = {
    hasIntent: false,
    intentType: "unknown",
    amount: null,
    description: null,
    peopleCount: null,
    peopleNames: [],
    splitType: null,
    transferTo: null,
    readyToConfirm: false,
    followUp: null,
    ...overrides,
  };
  result.readyToConfirm = isReadyToConfirm(result);
  return result;
}
