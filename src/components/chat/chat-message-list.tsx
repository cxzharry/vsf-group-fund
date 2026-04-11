// Orchestrates all chat message types, groups by date, renders in feed
"use client";

import { useEffect, useRef } from "react";
import { DateDivider } from "./date-divider";
import { BillCardBubble } from "./bill-card-bubble";
import { OpenBillCard } from "./open-bill-card";
import { TransferPill } from "./transfer-pill";
import type { ChatMessage, Bill, Member, BillCheckin } from "@/lib/types";

interface MessageFeedItem {
  type: "chat_message" | "bill";
  id: string;
  createdAt: string;
  message?: ChatMessage;
  bill?: Bill;
}

interface ChatMessageListProps {
  items: MessageFeedItem[];
  members: Record<string, Member>;
  billParticipantCounts: Record<string, number>;
  billCheckins: Record<string, BillCheckin[]>;
  currentMemberId: string | null;
  onCheckin: (billId: string) => void;
  onAddPeople: (billId: string) => void;
  onCloseBill: (billId: string) => void;
}

function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function ChatMessageList({
  items,
  members,
  billParticipantCounts,
  billCheckins,
  currentMemberId,
  onCheckin,
  onAddPeople,
  onCloseBill,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-gray-400">Chưa có hoạt động nào</p>
      </div>
    );
  }

  const rendered: React.ReactNode[] = [];
  let lastDate = "";

  for (const item of items) {
    if (!isSameDay(item.createdAt, lastDate || "")) {
      lastDate = item.createdAt;
      rendered.push(
        <DateDivider
          key={`divider-${item.id}`}
          date={formatDateDivider(item.createdAt)}
        />
      );
    }

    if (item.type === "bill" && item.bill) {
      const bill = item.bill;
      const payer = members[bill.paid_by] ?? null;
      const checkins = billCheckins[bill.id] ?? [];
      const hasCheckedIn = currentMemberId
        ? checkins.some((c) => c.member_id === currentMemberId)
        : false;
      // Payer or any member is considered admin for closing (simplification)
      const isPayerOrAdmin = bill.paid_by === currentMemberId;

      if (bill.bill_type === "open" && bill.status === "active") {
        rendered.push(
          <OpenBillCard
            key={item.id}
            bill={bill}
            payer={payer}
            checkins={checkins}
            memberMap={members}
            hasCheckedIn={hasCheckedIn}
            onCheckin={onCheckin}
            onAddPeople={onAddPeople}
            onCloseBill={onCloseBill}
            currentMemberId={currentMemberId}
            isPayerOrAdmin={isPayerOrAdmin}
          />
        );
      } else {
        rendered.push(
          <BillCardBubble
            key={item.id}
            bill={bill}
            payer={payer}
            participantCount={billParticipantCounts[bill.id] ?? 0}
            currentMemberId={currentMemberId}
          />
        );
      }
    } else if (item.type === "chat_message" && item.message) {
      const msg = item.message;

      if (msg.message_type === "transfer_card" && msg.metadata) {
        const meta = msg.metadata as {
          from_member_id?: string;
          to_member_id?: string;
          amount?: number;
        };
        const fromName = members[meta.from_member_id ?? ""]?.display_name ?? "Ai đó";
        const toName = members[meta.to_member_id ?? ""]?.display_name ?? "Ai đó";
        const amount = meta.amount ?? 0;
        rendered.push(
          <TransferPill key={item.id} fromName={fromName} toName={toName} amount={amount} />
        );
      } else if (
        msg.message_type === "text" ||
        msg.message_type === "system" ||
        msg.message_type === "bill_card" ||
        msg.message_type === "ai_response"
      ) {
        const sender = msg.sender_id ? members[msg.sender_id] : null;
        const isMe = msg.sender_id === currentMemberId;
        // Skip bill_card system messages — the bill itself renders in feed
        if (msg.message_type === "bill_card") continue;

        rendered.push(
          <div
            key={item.id}
            className={`mx-4 my-1 flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                isMe
                  ? "bg-[#3A5CCC] text-white"
                  : "bg-white text-gray-900 shadow-sm"
              }`}
            >
              {!isMe && sender && (
                <p className="mb-0.5 text-[10px] font-semibold text-gray-400">
                  {sender.display_name}
                </p>
              )}
              <p>{msg.content}</p>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="flex flex-col py-2">
      {rendered}
      <div ref={bottomRef} />
    </div>
  );
}

export type { MessageFeedItem };
