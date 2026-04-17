"use client";

// US-E3-2: Split Sheet — choose members & amounts with equal/custom modes
// 2 modes only (PRD US-E3-2): "Chia đều" and "Chia không đều"
// AC-E3-2.7: toggle 2 modes | AC-E3-2.8: auto-switch | AC-E3-2.11: search filter
import { useState, useMemo } from "react";
import { formatVND } from "@/lib/format-vnd";
import type { Member } from "@/lib/types";

// Only 2 split modes per PRD US-E3-2
type SplitMode = "equal" | "custom";

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

// Normalize Vietnamese diacritics for search — AC-E3-2.11
function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function SplitSheet({ totalAmount, groupMembers, payerId, onConfirm, onClose }: SplitSheetProps) {
  const [mode, setMode] = useState<SplitMode>("equal");
  const [search, setSearch] = useState("");
  // Track which members are selected (all by default — Case A, payer can uncheck)
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(groupMembers.map(m => m.id))
  );
  // Custom amounts per member
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
    } else {
      selectedMembers.forEach(m => {
        result[m.id] = parseInt(customAmounts[m.id] || "0", 10) || 0;
      });
    }
    return result;
  }, [mode, selected, customAmounts, totalAmount, groupMembers]);

  const totalSplit = Object.values(splits).reduce((s, v) => s + v, 0);
  const remaining = totalAmount - totalSplit;
  // In equal mode, splits are always balanced by design so canConfirm just needs ≥1 selected
  const canConfirm = selected.size > 0 && (mode === "equal" || remaining === 0);

  // AC-E3-2.11: real-time search filter, no diacritic distinction
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return groupMembers;
    const q = normalizeVi(search.trim());
    return groupMembers.filter(m => normalizeVi(m.display_name).includes(q));
  }, [groupMembers, search]);

  function toggleMember(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // AC-E3-2.8: auto-switch to "custom" when user edits any row amount
  function handleAmountChange(memberId: string, value: string) {
    const raw = value.replace(/\D/g, "");
    setCustomAmounts(prev => ({ ...prev, [memberId]: raw }));
    if (mode === "equal") {
      setMode("custom");
    }
  }

  // Validation display per AC-E3-2.9
  const overageText = remaining < 0
    ? `Vượt ${formatVND(Math.abs(remaining))}đ`
    : remaining > 0
    ? `Còn ${formatVND(remaining)}đ`
    : null;

  const modes: { key: SplitMode; label: string }[] = [
    { key: "equal", label: "Chia đều" },
    { key: "custom", label: "Chia không đều" },
  ];

  return (
    <>
      {/* Backdrop — 40% black per sheet spec */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Sheet — rounded-t-[20px], shadow.sheet per tokens */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        {/* Drag handle: 36x4 — components.md §4 */}
        <div className="flex shrink-0 justify-center py-2">
          <div className="h-1 w-9 rounded-full bg-[#D1D1D6]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3">
          <h2 className="text-[17px] font-bold text-[#1C1C1E]">Chọn người & số tiền</h2>
          <button type="button" onClick={onClose} className="text-base text-[#AEAEB2]" aria-label="Đóng">✕</button>
        </div>

        {/* Mode tabs — 2 modes only */}
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

        {/* Search filter — AC-E3-2.11 */}
        <div className="shrink-0 px-5 pb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thành viên..."
            className="w-full rounded-full border border-[#E5E5EA] bg-[#F2F2F7] px-4 py-2 text-[13px] outline-none focus:border-[#3A5CCC]"
          />
        </div>

        {/* Member list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5">
          {filteredMembers.map(m => {
            const isSelected = selected.has(m.id);
            const equalAmt = splits[m.id] ?? 0;
            const bg = getAvatarColor(m.display_name);
            const initial = (m.display_name.charAt(0) || "?").toUpperCase();
            const isPayer = m.id === payerId;

            return (
              <div key={m.id} className="flex h-[60px] items-center gap-3">
                {/* Avatar — xs 22px per avatar spec for inline mentions */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: bg }}>
                  {initial}
                </div>

                {/* Name + payer hint */}
                <div className="min-w-0 flex-1">
                  <span className={`text-[15px] font-semibold ${isSelected ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}>
                    {m.display_name}
                  </span>
                  {isPayer && (
                    <span className="ml-1 text-[11px] text-[#AEAEB2]">· người trả</span>
                  )}
                </div>

                {/* Amount: pill for equal, input for custom */}
                {mode === "equal" ? (
                  <span className="rounded-[8px] bg-[#F2F2F7] px-3 py-1.5 text-[13px] font-medium text-[#1C1C1E]">
                    {isSelected ? `${formatVND(equalAmt)}đ` : "—"}
                  </span>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmounts[m.id] || ""}
                    onChange={e => handleAmountChange(m.id, e.target.value)}
                    placeholder="0đ"
                    disabled={!isSelected}
                    className="w-20 rounded-[8px] bg-[#F2F2F7] px-3 py-1.5 text-right text-[13px] font-medium text-[#1C1C1E] outline-none disabled:text-[#AEAEB2]"
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
          {/* Remaining — only relevant in custom mode */}
          {mode === "custom" && (
            <div className="flex items-center justify-between pb-2">
              <span className="text-[13px] text-[#8E8E93]">Còn lại chưa chia</span>
              <span className={`text-[13px] font-semibold ${
                remaining === 0 ? "text-[#34C759]" : remaining < 0 ? "text-[#FF3B30]" : "text-[#FF9500]"
              }`}>
                {remaining === 0 ? "Khớp ✓" : overageText}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pb-3">
            <span className="text-[15px] font-semibold text-[#1C1C1E]">Tổng bill</span>
            <span className="text-[15px] font-bold text-[#1C1C1E]">{formatVND(totalAmount)}đ</span>
          </div>

          {/* Confirm CTA — primary button lg: h-[54px] rounded-[14px] */}
          <button
            type="button"
            onClick={() => canConfirm && onConfirm(splits)}
            disabled={!canConfirm}
            className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[17px] font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </>
  );
}
