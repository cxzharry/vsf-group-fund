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
  group_id: string | null;
  created_by: string;
  created_at: string;
}

export interface BillParticipant {
  id: string;
  bill_id: string;
  member_id: string;
  amount: number;
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
