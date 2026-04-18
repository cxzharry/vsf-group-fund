export interface Member {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  telegram_chat_id: string | null;
  setup_done: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface Bill {
  id: string;
  title: string;
  total_amount: number;
  paid_by: string;
  split_type: "equal" | "custom";
  bill_type: "standard" | "open";
  status: "active" | "closed";
  group_id: string | null;
  chat_message_id: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
}

export type ChatMessageType = "text" | "bill_card" | "transfer_card" | "ai_response" | "system";

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string | null;
  message_type: ChatMessageType;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface BillCheckin {
  id: string;
  bill_id: string;
  member_id: string | null;
  guest_name: string | null;
  added_by: string;
  checked_in_at: string;
}

export interface BillParticipant {
  id: string;
  bill_id: string;
  /** null for guest/anonymous rows */
  member_id: string | null;
  amount: number;
  /** Case C: named guest with no NoPay account */
  guest_name: string | null;
  /** Case D: anonymous participant — not tracked by name */
  is_anonymous: boolean;
}

export interface Debt {
  id: string;
  bill_id: string;
  debtor_id: string; // who owes
  creditor_id: string; // who is owed
  amount: number;
  remaining: number;
  status: "pending" | "confirmed" | "partial";
  created_at: string;
}

export interface PaymentConfirmation {
  id: string;
  debt_id: string;
  confirmed_by: "debtor" | "creditor";
  method: "screenshot_ocr" | "manual_debtor" | "manual_creditor";
  image_url: string | null;
  ocr_result: Record<string, unknown> | null;
  amount_detected: number | null;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
}
