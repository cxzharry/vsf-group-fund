/**
 * Validate migration 005 SQL structure.
 * Parses the SQL file and checks all required tables, columns, constraints, and policies exist.
 */
import { readFileSync } from "fs";
import { join } from "path";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/005-chat-and-open-bills.sql"
);
const sql = readFileSync(migrationPath, "utf-8");

describe("Migration 005: chat_messages table", () => {
  test("creates chat_messages table", () => {
    expect(sql).toMatch(/create table.*public\.chat_messages/i);
  });

  test("has required columns", () => {
    expect(sql).toMatch(/group_id\s+uuid/i);
    expect(sql).toMatch(/sender_id\s+uuid/i);
    expect(sql).toMatch(/message_type\s+text/i);
    expect(sql).toMatch(/content\s+text/i);
    expect(sql).toMatch(/metadata\s+jsonb/i);
    expect(sql).toMatch(/created_at\s+timestamptz/i);
  });

  test("message_type has correct check constraint", () => {
    expect(sql).toMatch(/text.*bill_card.*transfer_card.*ai_response.*system/i);
  });

  test("sender_id is nullable (for system messages)", () => {
    // Should NOT have 'not null' on sender_id
    const senderLine = sql
      .split("\n")
      .find((l) => l.includes("sender_id") && l.includes("uuid"));
    expect(senderLine).toBeDefined();
    expect(senderLine).not.toMatch(/not null/i);
  });

  test("group_id cascades on delete", () => {
    expect(sql).toMatch(/group_id.*on delete cascade/i);
  });
});

describe("Migration 005: bill_checkins table", () => {
  test("creates bill_checkins table", () => {
    expect(sql).toMatch(/create table.*public\.bill_checkins/i);
  });

  test("has required columns", () => {
    expect(sql).toMatch(/bill_id\s+uuid/i);
    expect(sql).toMatch(/member_id\s+uuid/i);
    expect(sql).toMatch(/guest_name\s+text/i);
    expect(sql).toMatch(/added_by\s+uuid/i);
    expect(sql).toMatch(/checked_in_at\s+timestamptz/i);
  });

  test("has check constraint: member_id or guest_name required", () => {
    expect(sql).toMatch(
      /check\s*\(\s*member_id\s+is\s+not\s+null\s+or\s+guest_name\s+is\s+not\s+null\s*\)/i
    );
  });

  test("unique index only for non-null member_id", () => {
    // Multi-line SQL — check parts separately
    expect(sql).toMatch(/create unique index.*bill_checkins/i);
    expect(sql).toMatch(/where\s+member_id\s+is\s+not\s+null/i);
  });

  test("member_id is nullable (for guests)", () => {
    const memberLine = sql
      .split("\n")
      .find(
        (l) =>
          l.includes("member_id") &&
          l.includes("uuid") &&
          l.includes("bill_checkins")
      );
    // In the bill_checkins table context, member_id should not have NOT NULL
    // Check by looking at the table definition block
    const tableBlock = sql.match(
      /create table.*bill_checkins[\s\S]*?\);/i
    )?.[0];
    expect(tableBlock).toBeDefined();
    const memberCol = tableBlock!
      .split("\n")
      .find((l) => /^\s+member_id/.test(l));
    expect(memberCol).toBeDefined();
    expect(memberCol).not.toMatch(/\bnot null\b/i);
  });
});

describe("Migration 005: bills table alterations", () => {
  test("adds bill_type column with default 'standard'", () => {
    expect(sql).toMatch(/alter table.*bills.*add.*bill_type.*default\s+'standard'/i);
  });

  test("adds status column with default 'active'", () => {
    expect(sql).toMatch(/alter table.*bills.*add.*status.*default\s+'active'/i);
  });

  test("adds chat_message_id column", () => {
    expect(sql).toMatch(/alter table.*bills.*add.*chat_message_id/i);
  });

  test("adds photo_url column", () => {
    expect(sql).toMatch(/alter table.*bills.*add.*photo_url/i);
  });

  test("bill_type check constraint includes standard and open", () => {
    expect(sql).toMatch(/bill_type.*in.*'standard'.*'open'/i);
  });

  test("status check constraint includes active and closed", () => {
    expect(sql).toMatch(/status.*in.*'active'.*'closed'/i);
  });

  test("uses IF NOT EXISTS for idempotency", () => {
    const alterLines = sql
      .split("\n")
      .filter((l) => /alter table.*add/i.test(l));
    alterLines.forEach((line) => {
      expect(line).toMatch(/if not exists/i);
    });
  });
});

describe("Migration 005: indexes", () => {
  test("creates chat_messages index on (group_id, created_at)", () => {
    expect(sql).toMatch(/idx_chat_messages_group_created/i);
    expect(sql).toMatch(/group_id.*created_at/i);
  });

  test("creates bill_checkins index on (bill_id)", () => {
    expect(sql).toMatch(/idx_bill_checkins_bill/i);
  });
});

describe("Migration 005: RLS policies", () => {
  test("enables RLS on chat_messages", () => {
    expect(sql).toMatch(
      /alter table.*chat_messages.*enable row level security/i
    );
  });

  test("enables RLS on bill_checkins", () => {
    expect(sql).toMatch(
      /alter table.*bill_checkins.*enable row level security/i
    );
  });

  test("chat_messages has select policy for group members", () => {
    expect(sql).toMatch(/on public\.chat_messages for select/i);
    expect(sql).toMatch(/group_members/);
  });

  test("chat_messages has insert policy for group members", () => {
    expect(sql).toMatch(/on public\.chat_messages for insert/i);
  });

  test("bill_checkins has select policy", () => {
    expect(sql).toMatch(/on public\.bill_checkins for select/i);
  });

  test("bill_checkins has insert policy", () => {
    expect(sql).toMatch(/on public\.bill_checkins for insert/i);
  });

  test("bill_checkins has delete policy for bill creator", () => {
    expect(sql).toMatch(/on public\.bill_checkins for delete/i);
    expect(sql).toMatch(/created_by/);
  });
});
