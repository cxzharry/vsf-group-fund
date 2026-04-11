/**
 * Type-level tests: verify TypeScript interfaces match DB schema expectations.
 * These are compile-time checks — if this file compiles, types are consistent.
 */
import type {
  Bill,
  ChatMessage,
  ChatMessageType,
  BillCheckin,
  Member,
  Group,
  GroupMember,
  BillParticipant,
  Debt,
  PaymentConfirmation,
} from "../types";

// Helper: assert type assignability at compile time
function assertType<T>(_val: T) {}

describe("TypeScript interfaces match schema", () => {
  test("Bill has open bill fields", () => {
    const bill: Bill = {
      id: "uuid",
      title: "Lunch",
      total_amount: 500000,
      paid_by: "uuid",
      split_type: "equal",
      bill_type: "standard",
      status: "active",
      group_id: null,
      chat_message_id: null,
      photo_url: null,
      created_by: "uuid",
      created_at: "2026-01-01T00:00:00Z",
    };
    assertType<Bill>(bill);

    // Open bill variant
    const openBill: Bill = {
      ...bill,
      bill_type: "open",
      status: "active",
    };
    assertType<Bill>(openBill);

    // Closed bill
    const closedBill: Bill = { ...bill, status: "closed" };
    assertType<Bill>(closedBill);
  });

  test("ChatMessage supports all message types", () => {
    const types: ChatMessageType[] = [
      "text",
      "bill_card",
      "transfer_card",
      "ai_response",
      "system",
    ];
    expect(types).toHaveLength(5);

    const msg: ChatMessage = {
      id: "uuid",
      group_id: "uuid",
      sender_id: "uuid",
      message_type: "text",
      content: "hello",
      metadata: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    assertType<ChatMessage>(msg);

    // System message with no sender
    const sysMsg: ChatMessage = { ...msg, sender_id: null, message_type: "system" };
    assertType<ChatMessage>(sysMsg);

    // Bill card with metadata
    const billCard: ChatMessage = {
      ...msg,
      message_type: "bill_card",
      content: '{"bill_id": "uuid"}',
      metadata: { bill_id: "uuid", amount: 500000 },
    };
    assertType<ChatMessage>(billCard);
  });

  test("BillCheckin supports members and guests", () => {
    // Member check-in
    const memberCheckin: BillCheckin = {
      id: "uuid",
      bill_id: "uuid",
      member_id: "uuid",
      guest_name: null,
      added_by: "uuid",
      checked_in_at: "2026-01-01T00:00:00Z",
    };
    assertType<BillCheckin>(memberCheckin);

    // Guest check-in (no member_id, has guest_name)
    const guestCheckin: BillCheckin = {
      ...memberCheckin,
      member_id: null,
      guest_name: "Khách 1",
    };
    assertType<BillCheckin>(guestCheckin);
  });

  test("Existing types still valid", () => {
    assertType<Member>({
      id: "uuid", user_id: "uuid", display_name: "Hai",
      email: "hai@test.com", avatar_url: null, bank_name: null,
      bank_account_no: null, bank_account_name: null,
      telegram_chat_id: null, created_at: "2026-01-01",
    });

    assertType<Group>({
      id: "uuid", name: "Team", created_by: "uuid",
      invite_code: "abc123", created_at: "2026-01-01",
    });

    assertType<GroupMember>({
      id: "uuid", group_id: "uuid", member_id: "uuid",
      role: "admin", joined_at: "2026-01-01",
    });

    assertType<BillParticipant>({
      id: "uuid", bill_id: "uuid", member_id: "uuid", amount: 100000,
    });

    assertType<Debt>({
      id: "uuid", bill_id: "uuid", debtor_id: "uuid",
      creditor_id: "uuid", amount: 100000, remaining: 100000,
      status: "pending", created_at: "2026-01-01",
    });

    assertType<PaymentConfirmation>({
      id: "uuid", debt_id: "uuid", confirmed_by: "debtor",
      method: "manual_debtor", image_url: null, ocr_result: null,
      amount_detected: null, status: "pending", created_at: "2026-01-01",
    });
  });
});
