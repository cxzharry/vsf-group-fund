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
  /** Category id from chat message metadata — undefined for legacy bills */
  category?: string;
  onDelete?: (billId: string) => void;
  onEdit?: (billId: string) => void;
}

// Generate consistent avatar color from a string
function avatarColor(name: string): string {
  const colors = [
    "bg-[#FF9500]",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-yellow-400",
    "bg-teal-400",
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

export function BillCardBubble({
  bill,
  payer,
  participantCount,
  currentMemberId,
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
  // Resolve category — only show chip for known non-default categories
  const catInfo = category && category !== "khac" ? getCategoryById(category) : null;

  const perPerson =
    participantCount > 0 ? Math.floor(bill.total_amount / participantCount) : 0;

  return (
    <div className="mx-4 my-1">
      <div className="rounded-[14px] bg-white p-3 shadow-sm">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#8E8E93]">
              {isMe ? "Bạn" : payerName} đã tạo
            </p>
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-[#1C1C1E]">
                {bill.title}
              </p>
              {catInfo && (
                <span className="shrink-0 rounded-full bg-[#F2F2F7] px-2 py-0.5 text-[11px] font-medium text-[#1C1C1E]">
                  <span aria-hidden>{catInfo.emoji}</span>
                  <span className="sr-only">{catInfo.label}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <p className="text-sm font-bold text-[#1C1C1E]">
              {formatVND(bill.total_amount)}đ
            </p>
            {/* 3-dot menu: only shown for bill owner */}
            {isOwner && (onDelete || onEdit) && (
              <div className="relative">
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
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-xl bg-white py-1 shadow-lg border border-[#E5E5EA]">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onEdit(bill.id); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#1C1C1E] hover:bg-[#F2F2F7]"
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
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#FF3B30] hover:bg-[#FFF3F0]"
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
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-[#E5E5EA] pt-2">
          <p className="text-xs text-[#AEAEB2]">
            {participantCount} người · {formatVND(perPerson)}đ/người
          </p>
          <div className="flex items-center gap-1.5">
            {bill.updated_at && bill.updated_at !== bill.created_at && (
              <span className="rounded-full bg-[#FFF8EC] px-2 py-0.5 text-xs text-[#FF9500]">
                Đã sửa
              </span>
            )}
            {bill.status === "closed" && (
              <span className="rounded-full bg-[#F2F2F7] px-2 py-0.5 text-xs text-[#AEAEB2]">
                Đã đóng
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
