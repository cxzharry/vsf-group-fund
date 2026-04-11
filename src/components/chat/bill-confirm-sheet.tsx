"use client";

// Bottom sheet for confirming bill creation — slides up over the chat
import { useState } from "react";
import { formatVND } from "@/lib/format-vnd";
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
}

type SplitChip = "equal" | "custom" | "open";

const SPLIT_CHIPS: { value: SplitChip; label: string }[] = [
  { value: "equal", label: "Chia đều" },
  { value: "custom", label: "Tuỳ chỉnh" },
  { value: "open", label: "Bill mở" },
];

export function BillConfirmSheet({
  intent,
  groupMembers,
  currentMember,
  onConfirm,
  onClose,
}: BillConfirmSheetProps) {
  const [amount, setAmount] = useState<number>(intent.amount ?? 0);
  const [description, setDescription] = useState<string>(intent.description ?? "");
  const [splitType, setSplitType] = useState<SplitChip>(
    (intent.splitType as SplitChip) ?? "equal"
  );
  const [peopleCount, setPeopleCount] = useState<number>(
    intent.peopleCount ?? groupMembers.length
  );
  const [payerId, setPayerId] = useState<string>(currentMember.id);
  const [submitting, setSubmitting] = useState(false);

  const perPerson =
    splitType !== "open" && peopleCount > 0
      ? Math.floor(amount / peopleCount)
      : null;

  async function handleConfirm() {
    if (!amount || !description.trim()) return;
    setSubmitting(true);
    await onConfirm({
      amount,
      description: description.trim(),
      splitType,
      peopleCount,
      payerId,
      billType: splitType === "open" ? "open" : "standard",
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

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <h2 className="text-base font-bold text-gray-900">Xác nhận bill</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-4 pb-4 space-y-3">
          {/* Amount field */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Tổng tiền
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent text-lg font-bold text-gray-900 outline-none"
              />
              <span className="ml-1 text-sm font-medium text-gray-400">đ</span>
            </div>
          </div>

          {/* Description field */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Mô tả
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bữa ăn, cafe, ..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-300"
            />
          </div>

          {/* Split type chips */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Loại chia
            </label>
            <div className="flex gap-2">
              {SPLIT_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSplitType(chip.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    splitType === chip.value
                      ? "bg-[#3A5CCC] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* People count + per-person (only for non-open) */}
          {splitType !== "open" && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Số người
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    className="text-lg font-bold text-gray-500"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-bold text-gray-900">
                    {peopleCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPeopleCount(peopleCount + 1)}
                    className="text-lg font-bold text-gray-500"
                  >
                    +
                  </button>
                </div>
              </div>

              {perPerson !== null && (
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Mỗi người
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-bold text-[#3A5CCC]">
                    {formatVND(perPerson)}đ
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payer selector */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Người trả
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none"
            >
              {groupMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name} {m.id === currentMember.id ? "(Bạn)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-gray-100 px-4 pt-3 pb-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !amount || !description.trim()}
            className="w-full rounded-2xl bg-[#3A5CCC] py-3.5 text-sm font-bold text-white shadow transition-opacity active:opacity-80 disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo bill"}
          </button>
        </div>
      </div>
    </>
  );
}
