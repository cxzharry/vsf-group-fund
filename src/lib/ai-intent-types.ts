/** Result from AI intent parsing of a chat message */
export interface ParsedBillIntent {
  /** Whether AI detected a bill-creation intent */
  hasIntent: boolean;
  /** Split bill or direct transfer */
  intentType: "split" | "transfer" | "unknown";
  /** Parsed amount in VND (null if not found) */
  amount: number | null;
  /** Description inferred from message */
  description: string | null;
  /** Number of people (null = unknown / bill mở) */
  peopleCount: number | null;
  /** Specific people names mentioned */
  peopleNames: string[];
  /** Split type inferred */
  splitType: "equal" | "custom" | "open" | null;
  /** Transfer target (for intent=transfer) */
  transferTo: string | null;
  /** Whether enough info to show confirm sheet */
  readyToConfirm: boolean;
  /** Follow-up question if missing info */
  followUp: FollowUpQuestion | null;
  /** Confidence score 0..1; <0.6 shows warning */
  confidence?: number;
  /** If message contained 2+ amounts, list of alt parses */
  alternates?: Array<{ amount: number; description: string | null }>;
}

export interface FollowUpQuestion {
  question: string;
  options: FollowUpOption[];
}

export interface FollowUpOption {
  label: string;
  value: string;
  description: string;
}

/** Minimum fields needed to open confirm sheet */
export function isReadyToConfirm(parsed: ParsedBillIntent): boolean {
  return (
    parsed.hasIntent &&
    parsed.amount !== null &&
    parsed.intentType !== "unknown"
  );
}
