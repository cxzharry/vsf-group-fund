"use client";

// US-E3-4 Bill Details Sheet — half-sheet slide-up showing bill breakdown + actions
import { useEffect, useRef } from "react";
import { formatVND } from "@/lib/format-vnd";
import type { Bill, Member, BillParticipant, Debt } from "@/lib/types";

interface BillDetailsSheetProps {
  bill: Bill;
  payer: Member | null;
  participants: (BillParticipant & { member?: Member })[];
  debts: (Debt & { debtor?: Member })[];
  currentMemberId: string | null;
  onClose: () => void;
  onEdit: (billId: string) => void;
  onDelete: (billId: string) => void;
  onNudge?: (billId: string) => void;
  /** Navigate to transfer screen for current user's pending debt on this bill */
  onPayOwnDebt?: (debtId: string) => void;
}

const AVATAR_COLORS = [
  "#3A5CCC", "#34C759", "#FF9500", "#5856D6", "#FF3B30",
  "#AF52DE", "#00C7BE", "#FF2D55",
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const bg = getAvatarColor(name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BillDetailsSheet({
  bill,
  payer,
  participants,
  debts,
  currentMemberId,
  onClose,
  onEdit,
  onDelete,
  onNudge,
  onPayOwnDebt,
}: BillDetailsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Focus trap: focus sheet on mount
  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  const isOwner = bill.paid_by === currentMemberId;
  const pendingDebts = debts.filter((d) => d.status === "pending" || d.status === "partial");

  // Current user's role in this bill
  const myParticipation = currentMemberId
    ? participants.find((p) => p.member_id === currentMemberId)
    : null;
  const myDebt = currentMemberId
    ? debts.find((d) => d.debtor_id === currentMemberId)
    : null;
  const mySharePaid = myDebt?.status === "confirmed" || myDebt?.remaining === 0;
  // Amount owed: use debt.remaining (reflects partial payments) else fallback to participant.amount
  const myRemaining = myDebt?.remaining ?? myParticipation?.amount ?? 0;
  // Total owed to me (as creditor) if I'm the payer
  const owedToMe = isOwner
    ? pendingDebts.reduce((sum, d) => sum + (d.remaining ?? 0), 0)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label="Chi tiết bill"
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="w-full rounded-t-[20px] bg-white outline-none"
        style={{ maxHeight: "80dvh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#C7C7CC]" />
        </div>

        {/* Header: title + × */}
        <div className="flex items-start justify-between px-4 pt-2 pb-3">
          <div className="flex-1 min-w-0">
            <p className="truncate text-[20px] font-bold text-[#1C1C1E]">{bill.title}</p>
            <p className="mt-0.5 text-[28px] font-bold text-[#3A5CCC] leading-tight">
              {formatVND(bill.total_amount)}đ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-[#8E8E93]"
            aria-label="Đóng"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Your share banner — most important info for viewer */}
        {currentMemberId && (isOwner || myParticipation) && (
          <div className="mx-4 mb-1 mt-1 rounded-[12px] px-3 py-3"
               style={{
                 backgroundColor: isOwner
                   ? "#F0FFF4"
                   : mySharePaid
                   ? "#F2F2F7"
                   : "#FFF3F0",
               }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium uppercase tracking-wide"
                   style={{
                     color: isOwner ? "#34C759" : mySharePaid ? "#8E8E93" : "#FF9500",
                   }}>
                  {isOwner
                    ? "Bạn đã ứng"
                    : mySharePaid
                    ? "Phần bạn — đã thanh toán"
                    : `Bạn nợ ${payer?.display_name ?? "?"}`}
                </p>
                <p className="mt-0.5 text-[22px] font-bold"
                   style={{
                     color: isOwner ? "#34C759" : mySharePaid ? "#8E8E93" : "#FF3B30",
                   }}>
                  {formatVND(isOwner ? bill.total_amount : myRemaining)}đ
                </p>
                {isOwner && owedToMe > 0 && (
                  <p className="mt-0.5 text-[12px] text-[#8E8E93]">
                    Còn {pendingDebts.length} người nợ bạn tổng {formatVND(owedToMe)}đ
                  </p>
                )}
                {!isOwner && !mySharePaid && myParticipation && (
                  <p className="mt-0.5 text-[12px] text-[#8E8E93]">
                    Phần bạn {formatVND(myParticipation.amount)}đ trên tổng {formatVND(bill.total_amount)}đ
                  </p>
                )}
              </div>
              {!isOwner && !mySharePaid && myDebt?.id && onPayOwnDebt && (
                <button
                  type="button"
                  onClick={() => { onPayOwnDebt(myDebt.id); onClose(); }}
                  className="shrink-0 rounded-[12px] bg-[#FF3B30] px-4 py-2 text-[14px] font-semibold text-white active:opacity-80"
                >
                  Trả nợ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* Payer row */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#AEAEB2]">Người trả</p>
          <div className="flex items-center gap-3">
            <Avatar name={payer?.display_name ?? "?"} size={36} />
            <div>
              <p className="text-[15px] font-semibold text-[#1C1C1E]">{payer?.display_name ?? "?"}</p>
              <p className="text-[12px] text-[#8E8E93]">đã ứng {formatVND(bill.total_amount)}đ</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* Participants breakdown */}
        {participants.length > 0 && (
          <div className="px-4 py-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#AEAEB2]">
              Người tham gia ({participants.length})
            </p>
            <div className="space-y-2">
              {participants.map((p) => {
                const isPayer = p.member_id === bill.paid_by;
                const debt = debts.find((d) => d.debtor_id === p.member_id);
                const status = isPayer ? "paid" : (debt?.status ?? "pending");
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar name={p.member?.display_name ?? "?"} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#1C1C1E] truncate">
                        {p.member?.display_name ?? "?"}
                        {isPayer && (
                          <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">(trả)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-[#1C1C1E]">{formatVND(p.amount)}đ</p>
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        status === "paid" || status === "confirmed"
                          ? "bg-[#F0FFF4] text-[#34C759]"
                          : "bg-[#FFF3F0] text-[#FF9500]"
                      }`}
                    >
                      {status === "paid" || status === "confirmed" ? "Đã trả" : "Chưa trả"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* Date + status row */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[13px] text-[#8E8E93]">{formatDate(bill.created_at)}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
              bill.status === "closed"
                ? "bg-[#F0FFF4] text-[#34C759]"
                : "bg-[#F2F2F7] text-[#8E8E93]"
            }`}
          >
            {bill.status === "closed" ? "Đã đóng" : "Đang hoạt động"}
          </span>
        </div>

        {/* Actions — only for bill owner */}
        {isOwner && (
          <>
            <div className="mx-4 border-t border-[#E5E5EA]" />
            <div className="flex gap-2 px-4 py-4 pb-safe-bottom">
              <button
                type="button"
                onClick={() => { onEdit(bill.id); onClose(); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#3A5CCC] py-2.5 text-[14px] font-semibold text-[#3A5CCC] active:bg-[#EEF2FF]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                </svg>
                Sửa
              </button>

              {onNudge && pendingDebts.length > 0 && (
                <button
                  type="button"
                  onClick={() => { onNudge(bill.id); onClose(); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#FF9500] py-2.5 text-[14px] font-semibold text-[#FF9500] active:bg-[#FFF8EC]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Nhắc nợ
                </button>
              )}

              <button
                type="button"
                onClick={() => { onClose(); onDelete(bill.id); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#FF3B30] py-2.5 text-[14px] font-semibold text-[#FF3B30] active:bg-[#FFF3F0]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6 18.1 20a2 2 0 0 1-2 1.9H7.9a2 2 0 0 1-2-1.9L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Xóa
              </button>
            </div>
          </>
        )}

        {/* Bottom safe area padding for non-owner */}
        {!isOwner && <div className="pb-6" />}
      </div>
    </div>
  );
}
