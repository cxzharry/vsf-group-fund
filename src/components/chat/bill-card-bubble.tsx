// Bill card rendered in the chat feed (closed/standard bills)
"use client";
import { useState } from "react";
import { formatVND } from "@/lib/format-vnd";
import { getCategoryById } from "@/lib/bill-categories";
import type { Bill, Member } from "@/lib/types";

interface BillCardBubbleProps {
  bill: Bill;
  payer: Member | null;
  participantCount: number;
  currentMemberId: string | null;
  /** User's owed amount for this bill (debtor side). If undefined or 0, "Bạn mượn" row hidden. */
  userOwedAmount?: number;
  /** Category id from chat message metadata — undefined for legacy bills */
  category?: string;
  onDelete?: (billId: string) => void;
  onEdit?: (billId: string) => void;
}

// Generate consistent avatar color from a string
function avatarColor(name: string): string {
  const colors = [
    "bg-[#FF9500]",
    "bg-[#3A5CCC]",
    "bg-[#34C759]",
    "bg-[#AF52DE]",
    "bg-[#FF2D55]",
    "bg-[#FF9500]",
    "bg-[#00C7BE]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatBillDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

export function BillCardBubble({
  bill,
  payer,
  participantCount,
  currentMemberId,
  userOwedAmount,
  category,
  onDelete,
  onEdit,
}: BillCardBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const payerName = payer?.display_name ?? "Ai đó";
  const isMe = payer?.id === currentMemberId;
  const isOwner = bill.paid_by === currentMemberId;
  const initials = getInitials(payerName);
  const color = avatarColor(payerName);
  const catInfo = category && category !== "khac" ? getCategoryById(category) : null;
  const showOwed = typeof userOwedAmount === "number" && userOwedAmount > 0 && !isMe;

  return (
    <div className="mx-4 my-2">
      <div className="rounded-[14px] bg-white p-4 shadow-sm">
        {/* Row: avatar + content + timestamp */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white ${color}`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            {/* Sub-header: "X đã thanh toán" */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] text-[#8E8E93]">
                {isMe ? "Bạn" : payerName} đã thanh toán
              </p>
              <span className="shrink-0 text-[11px] text-[#AEAEB2]">
                {formatTime(bill.created_at)}
              </span>
            </div>

            {/* Title */}
            <p className="mt-0.5 truncate text-[16px] font-bold text-[#1C1C1E]">
              {bill.title}
            </p>

            {/* Meta row: date + N người + category */}
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8E8E93]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
              </svg>
              <span>Ngày ăn: {formatBillDate(bill.created_at)}</span>
              <span aria-hidden="true">·</span>
              <span>{participantCount} người</span>
              {catInfo && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{catInfo.emoji} {catInfo.label}</span>
                </>
              )}
            </div>
          </div>

          {/* 3-dot menu: only shown for bill owner */}
          {isOwner && (onDelete || onEdit) && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#AEAEB2] hover:bg-[#F2F2F7]"
                aria-label="Tùy chọn bill"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-[14px] bg-white py-1 shadow-lg border border-[#E5E5EA]">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onEdit(bill.id); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#1C1C1E] hover:bg-[#F2F2F7]"
                      >
                        <span>✏️</span> Sửa bill
                      </button>
                    )}
                    {onEdit && onDelete && (
                      <div className="mx-2 border-t border-[#E5E5EA]" />
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onDelete(bill.id); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#FF3B30] hover:bg-[#FFF3F0]"
                      >
                        <span>🗑</span> Xóa bill
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Amount section: Tổng + optional "Bạn mượn" */}
        <div className="mt-3 border-t border-[#E5E5EA] pt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8E8E93]">Tổng</span>
            <span className="text-[15px] font-semibold text-[#1C1C1E]">
              {formatVND(bill.total_amount)}đ
            </span>
          </div>
          {showOwed && (
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#8E8E93]">Bạn mượn</span>
              <span className="text-[15px] font-bold text-[#FF3B30]">
                {formatVND(userOwedAmount)}đ
              </span>
            </div>
          )}
        </div>

        {/* Footer: badges (quiet metadata) */}
        {((bill.updated_at && bill.updated_at !== bill.created_at) || bill.status === "closed") && (
          <div className="mt-2 flex items-center justify-end gap-1.5">
            {bill.updated_at && bill.updated_at !== bill.created_at && (
              <span className="text-[11px] text-[#8E8E93]">· Đã sửa</span>
            )}
            {bill.status === "closed" && (
              <span className="rounded-full bg-[#F0FFF4] px-2 py-0.5 text-[11px] font-medium text-[#34C759]">
                Đã đóng
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
