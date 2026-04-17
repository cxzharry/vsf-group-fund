"use client";

// US-E3-3: Split Sheet — choose members & amounts with equal/percent/custom modes
import { useState, useMemo } from "react";
import { formatVND } from "@/lib/format-vnd";
import type { Member } from "@/lib/types";

type SplitMode = "equal" | "percent" | "custom";

interface SplitSheetProps {
  totalAmount: number;
  groupMembers: Member[];
  payerId: string;
  onConfirm: (splits: Record<string, number>) => void;
  onClose: () => void;
}

const AVATAR_COLORS = [
  "#3A5CCC", "#34C759", "#FF9500", "#5856D6", "#FF3B30",
  "#FF6B6B", "#AF52DE", "#00C7BE", "#FF2D55",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function SplitSheet({ totalAmount, groupMembers, payerId, onConfirm, onClose }: SplitSheetProps) {
  const [mode, setMode] = useState<SplitMode>("equal");
  // Track which members are selected (all except payer by default)
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(groupMembers.filter(m => m.id !== payerId).map(m => m.id))
  );
  // Custom amounts per member (used in custom/percent modes)
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const splits = useMemo(() => {
    const result: Record<string, number> = {};
    const selectedMembers = groupMembers.filter(m => selected.has(m.id));
    if (selectedMembers.length === 0) return result;

    if (mode === "equal") {
      const perPerson = Math.floor(totalAmount / selectedMembers.length);
      const remainder = totalAmount - perPerson * selectedMembers.length;
      selectedMembers.forEach((m, i) => {
        result[m.id] = perPerson + (i < remainder ? 1 : 0);
      });
    } else if (mode === "percent") {
      selectedMembers.forEach(m => {
        const pct = parseFloat(customAmounts[m.id] || "0");
        result[m.id] = Math.floor(totalAmount * pct / 100);
      });
    } else {
      selectedMembers.forEach(m => {
        result[m.id] = parseInt(customAmounts[m.id] || "0", 10) || 0;
      });
    }
    return result;
  }, [mode, selected, customAmounts, totalAmount, groupMembers]);

  const totalSplit = Object.values(splits).reduce((s, v) => s + v, 0);
  const remaining = totalAmount - totalSplit;
  const canConfirm = selected.size > 0 && remaining === 0;

  function toggleMember(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAmountChange(memberId: string, value: string) {
    setCustomAmounts(prev => ({ ...prev, [memberId]: value }));
  }

  const modes: { key: SplitMode; label: string }[] = [
    { key: "equal", label: "Chia đều" },
    { key: "percent", label: "Chia %" },
    { key: "custom", label: "Tuỳ chỉnh" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.13)]">
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center py-2">
          <div className="h-1 w-9 rounded-full bg-[#D1D1D6]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3">
          <h2 className="text-[17px] font-bold text-[#1C1C1E]">Chọn người & số tiền</h2>
          <button type="button" onClick={onClose} className="text-base text-[#AEAEB2]" aria-label="Đóng">✕</button>
        </div>

        {/* Tab pills */}
        <div className="flex shrink-0 gap-2 px-5 pb-3">
          {modes.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                mode === m.key
                  ? "bg-[#EEF2FF] text-[#3A5CCC]"
                  : "bg-[#F2F2F7] text-[#8E8E93]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Member list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5">
          {groupMembers.filter(m => m.id !== payerId).map(m => {
            const isSelected = selected.has(m.id);
            const amount = splits[m.id] ?? 0;
            const bg = getAvatarColor(m.display_name);
            const initial = (m.display_name.charAt(0) || "?").toUpperCase();

            return (
              <div key={m.id} className="flex h-[60px] items-center gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: bg }}>
                  {initial}
                </div>

                {/* Name */}
                <span className={`flex-1 text-sm font-semibold ${isSelected ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}>
                  {m.display_name}
                </span>

                {/* Amount pill / input */}
                {mode === "equal" ? (
                  <span className="rounded-lg bg-[#F2F2F7] px-3 py-1.5 text-[13px] font-medium text-[#1C1C1E]">
                    {isSelected ? `${formatVND(amount)}đ` : "—"}
                  </span>
                ) : (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={customAmounts[m.id] || ""}
                    onChange={e => handleAmountChange(m.id, e.target.value)}
                    placeholder={mode === "percent" ? "%" : "0đ"}
                    disabled={!isSelected}
                    className="w-20 rounded-lg bg-[#F2F2F7] px-3 py-1.5 text-right text-[13px] font-medium text-[#1C1C1E] outline-none disabled:text-[#AEAEB2]"
                  />
                )}

                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded ${
                    isSelected ? "bg-[#3A5CCC]" : "border-[1.5px] border-[#D1D1D6]"
                  }`}
                >
                  {isSelected && <span className="text-xs font-bold text-white">✓</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#E5E5EA] px-5 pt-3 pb-4">
          {/* Remaining */}
          <div className="flex items-center justify-between pb-2">
            <span className="text-[13px] text-[#8E8E93]">Còn lại chưa chia</span>
            <span className={`text-[13px] font-semibold ${remaining === 0 ? "text-[#34C759]" : "text-[#FF9500]"}`}>
              {formatVND(remaining)}đ
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-semibold text-[#1C1C1E]">Tổng bill</span>
            <span className="text-sm font-bold text-[#1C1C1E]">{formatVND(totalAmount)}đ</span>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => canConfirm && onConfirm(splits)}
            disabled={!canConfirm}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-base font-bold text-white transition-opacity active:opacity-80 disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </>
  );
}
