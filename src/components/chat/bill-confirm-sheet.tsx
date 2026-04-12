"use client";

// Bottom sheet for confirming bill creation — matches Pencil half-sheet design
import { useState } from "react";
import { formatVND } from "@/lib/format-vnd";
import { SplitSheet } from "@/components/chat/split-sheet";
import type { ParsedBillIntent } from "@/lib/ai-intent-types";
import type { Member } from "@/lib/types";

interface BillConfirmSheetProps {
  intent: ParsedBillIntent;
  groupMembers: Member[];
  currentMember: Member;
  onConfirm: (data: BillConfirmData) => Promise<void>;
  onClose: () => void;
}

export interface BillConfirmData {
  amount: number;
  description: string;
  splitType: "equal" | "custom" | "open";
  peopleCount: number;
  payerId: string;
  billType: "standard" | "open";
  /** Custom per-member splits (member_id → amount). Only set when splitType="custom". */
  customSplits?: Record<string, number>;
}

const AVATAR_COLORS = [
  "#3A5CCC", "#34C759", "#FF9500", "#5856D6", "#FF3B30", "#FF6B6B",
  "#AF52DE", "#00C7BE", "#FF2D55",
];

function getInitial(name: string): string {
  return (name.charAt(0) || "?").toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MiniAvatar({ member, size = 22 }: { member: Member; size?: number }) {
  const bg = getAvatarColor(member.display_name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: bg }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>
        {getInitial(member.display_name)}
      </span>
    </div>
  );
}

export function BillConfirmSheet({
  intent,
  groupMembers,
  currentMember,
  onConfirm,
  onClose,
}: BillConfirmSheetProps) {
  const [amount] = useState<number>(intent.amount ?? 0);
  const [description] = useState<string>(intent.description ?? "");
  const [splitType] = useState<"equal" | "custom" | "open">(
    (intent.splitType as "equal" | "custom" | "open") ?? "equal"
  );
  const [peopleCount] = useState<number>(
    intent.peopleCount ?? groupMembers.length
  );
  const [payerId] = useState<string>(currentMember.id);
  const [submitting, setSubmitting] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [customSplits, setCustomSplits] = useState<Record<string, number> | null>(null);

  const perPerson =
    splitType !== "open" && peopleCount > 0
      ? Math.floor(amount / peopleCount)
      : null;

  const payer = groupMembers.find((m) => m.id === payerId) ?? currentMember;

  // Show up to 5 member avatars for "chia cho" row
  const shownMembers = groupMembers.slice(0, 5);
  const extraCount = groupMembers.length - shownMembers.length;

  async function handleConfirm() {
    if (!amount || !description.trim()) return;
    setSubmitting(true);
    await onConfirm({
      amount,
      description: description.trim(),
      splitType: customSplits ? "custom" : splitType,
      peopleCount: customSplits ? Object.keys(customSplits).length : peopleCount,
      payerId,
      billType: splitType === "open" ? "open" : "standard",
      customSplits: customSplits ?? undefined,
    });
    setSubmitting(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Half-sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.13)] animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="h-1 w-9 rounded-full bg-[#D1D1D6]" />
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 pb-[34px] pt-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-black">
              ✦ Xác nhận bill
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-base text-[#AEAEB2]"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            {/* Mô tả */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#8E8E93]">Mô tả</span>
              <span className="text-[13px] text-[#1C1C1E]">{description || "—"}</span>
            </div>

            {/* Chia cho — tap to open US-3.3 Split Sheet */}
            <button
              type="button"
              onClick={() => setShowSplit(true)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-[13px] text-[#8E8E93]">
                Chia cho {customSplits ? `(${Object.keys(customSplits).length} người)` : ""}
              </span>
              <div className="flex items-center gap-1">
                {shownMembers.map((m) => (
                  <MiniAvatar key={m.id} member={m} size={22} />
                ))}
                {extraCount > 0 && (
                  <span className="ml-1 text-xs text-[#8E8E93]">+{extraCount}</span>
                )}
                <span className="ml-1 text-xs text-[#3A5CCC]">▸</span>
              </div>
            </button>

            {/* Mỗi người */}
            {perPerson !== null && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8E8E93]">Mỗi người</span>
                <span className="text-sm font-semibold text-[#3A5CCC]">
                  {formatVND(perPerson)}đ
                </span>
              </div>
            )}

            {/* Người trả */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#8E8E93]">Người trả</span>
              <div className="flex items-center gap-1.5">
                <MiniAvatar member={payer} size={22} />
                <span className="text-[13px] font-semibold text-[#1C1C1E]">
                  {payer.id === currentMember.id ? "Bạn" : payer.display_name}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#E5E5EA]" />

          {/* Upload row */}
          <button
            type="button"
            className="flex h-[38px] w-full items-center justify-center rounded-[10px] bg-[#F2F2F7] text-[13px] text-[#8E8E93]"
          >
            📎 Thêm ảnh bill
          </button>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !amount || !description.trim()}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#3A5CCC] text-[15px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo bill"}
          </button>
        </div>
      </div>

      {/* US-3.3 Split Sheet */}
      {showSplit && (
        <SplitSheet
          totalAmount={amount}
          groupMembers={groupMembers}
          payerId={payerId}
          onConfirm={(splits) => {
            setCustomSplits(splits);
            setShowSplit(false);
          }}
          onClose={() => setShowSplit(false)}
        />
      )}
    </>
  );
}
