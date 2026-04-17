"use client";

// US-E3-1 Create Bill Sheet — half-sheet with required fields + CTA pinned bottom
import { useState } from "react";
import { formatVND } from "@/lib/format-vnd";
import { SplitSheet } from "@/components/chat/split-sheet";
import { inferCategory } from "@/lib/bill-categories";
import type { BillCategoryId } from "@/lib/bill-categories";
import type { ParsedBillIntent } from "@/lib/ai-intent-types";
import type { Member } from "@/lib/types";

interface BillConfirmSheetProps {
  intent: ParsedBillIntent;
  groupMembers: Member[];
  currentMember: Member;
  onConfirm: (data: BillConfirmData) => Promise<void>;
  onClose: () => void;
  mode?: "create" | "edit";
  initialData?: Partial<BillConfirmData>;
}

export interface BillConfirmData {
  amount: number;
  description: string;
  splitType: "equal" | "custom" | "open";
  peopleCount: number;
  payerId: string;
  billType: "standard" | "open";
  category: BillCategoryId;
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
  mode = "create",
  initialData,
}: BillConfirmSheetProps) {
  const isEdit = mode === "edit";
  const [amount, setAmount] = useState<number>(initialData?.amount ?? intent.amount ?? 0);
  const [amountInput, setAmountInput] = useState<string>(
    initialData?.amount || intent.amount ? String(initialData?.amount ?? intent.amount) : ""
  );
  const [description, setDescription] = useState<string>(
    initialData?.description ?? intent.description ?? ""
  );
  const [peopleCount, setPeopleCount] = useState<number>(
    intent.peopleCount ?? groupMembers.length
  );
  const [payerId] = useState<string>(currentMember.id);
  const [billType, setBillType] = useState<"split" | "transfer">("split");
  const [submitting, setSubmitting] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [customSplits, setCustomSplits] = useState<Record<string, number> | null>(null);

  const payer = groupMembers.find((m) => m.id === payerId) ?? currentMember;
  const category = inferCategory(description);
  const perPerson =
    peopleCount > 0 && amount > 0 ? Math.floor(amount / peopleCount) : 0;

  const isValid = amount > 0 && description.trim().length > 0 && peopleCount > 0;

  async function handleConfirm() {
    if (!isValid) return;
    setSubmitting(true);
    await onConfirm({
      amount,
      description: description.trim(),
      splitType: customSplits ? "custom" : "equal",
      peopleCount: customSplits ? Object.keys(customSplits).length : peopleCount,
      payerId,
      billType: "standard",
      category,
      customSplits: customSplits ?? undefined,
    });
    setSubmitting(false);
  }

  function handleBillTypeChange(type: "split" | "transfer") {
    if (type === "transfer") {
      // US-E3-6 Transfer flow — not yet wired here
      onClose();
      return;
    }
    setBillType(type);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.13)] animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center py-2">
          <div className="h-1 w-9 rounded-full bg-[#D1D1D6]" />
        </div>

        <div className="flex flex-1 flex-col gap-3 px-5 pb-[34px] pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-black">
              {isEdit ? "Sửa bill" : "Tạo bill"}
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

          {!isEdit && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleBillTypeChange("split")}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  billType === "split"
                    ? "bg-[#EEF2FF] text-[#3A5CCC]"
                    : "bg-[#F2F2F7] text-[#8E8E93]"
                }`}
              >
                Chia tiền
              </button>
              <button
                type="button"
                onClick={() => handleBillTypeChange("transfer")}
                className="rounded-full bg-[#F2F2F7] px-3.5 py-1.5 text-[13px] font-medium text-[#8E8E93]"
              >
                Chuyển tiền
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-[13px] text-[#8E8E93]">Số tiền</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setAmountInput(raw);
                  setAmount(raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="0đ"
                className="min-w-0 flex-1 text-right text-[22px] font-bold text-[#3A5CCC] outline-none placeholder-[#AEAEB2]"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-[13px] text-[#8E8E93]">Mô tả</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Ăn trưa team"
                className="min-w-0 flex-1 text-right text-[13px] text-[#1C1C1E] outline-none placeholder-[#AEAEB2]"
              />
            </div>

            {!isEdit && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8E8E93]">Người trả</span>
                <div className="flex items-center gap-1.5">
                  <MiniAvatar member={payer} size={22} />
                  <span className="text-[14px] font-medium text-[#1C1C1E]">
                    {payer.display_name}
                    {payer.id === currentMember.id && " (bạn)"}
                  </span>
                  <span className="text-[15px] text-[#C7C7CC]">›</span>
                </div>
              </div>
            )}

            {!isEdit && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8E8E93]">Chia cho</span>
                <button
                  type="button"
                  onClick={() => setShowSplit(true)}
                  className="text-[13px] font-medium text-[#3A5CCC] underline underline-offset-2"
                >
                  {customSplits
                    ? `${Object.keys(customSplits).length} người · ${formatVND(perPerson)}đ/người`
                    : "Chọn thành viên"}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !isValid}
            className={`flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-opacity active:opacity-80 ${
              isValid && !submitting ? "bg-[#3A5CCC]" : "bg-[#C7C7CC]"
            }`}
          >
            {submitting
              ? isEdit ? "Đang lưu..." : "Đang tạo..."
              : isEdit ? "Lưu thay đổi" : "Tạo"}
          </button>
        </div>
      </div>

      {showSplit && (
        <SplitSheet
          totalAmount={amount}
          groupMembers={groupMembers}
          payerId={payerId}
          onConfirm={(splits) => {
            setCustomSplits(splits);
            setPeopleCount(Object.keys(splits).length);
            setShowSplit(false);
          }}
          onClose={() => setShowSplit(false)}
        />
      )}
    </>
  );
}
