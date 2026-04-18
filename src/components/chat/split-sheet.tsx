"use client";

// US-E3-2: Split Sheet — Case A (members), Case C (guests), Case D (anonymous)
// 2 modes: "Chia đều" and "Chia không đều" per PRD US-E3-2
import { useState, useMemo } from "react";
import { formatVND } from "@/lib/format-vnd";
import type { Member } from "@/lib/types";
import type { GuestSplit, AnonSplit } from "@/components/chat/bill-confirm-sheet";

type SplitMode = "equal" | "custom";

interface SplitSheetProps {
  totalAmount: number;
  groupMembers: Member[];
  payerId: string;
  onConfirm: (
    splits: Record<string, number>,
    guests: GuestSplit[],
    anon: AnonSplit | null
  ) => void;
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
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

export function SplitSheet({ totalAmount, groupMembers, payerId, onConfirm, onClose }: SplitSheetProps) {
  const [mode, setMode] = useState<SplitMode>("equal");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(groupMembers.map(m => m.id)));
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Case C: named guests
  const [guests, setGuests] = useState<GuestSplit[]>([]);
  const [guestInput, setGuestInput] = useState("");
  const [guestAmountInput, setGuestAmountInput] = useState("");

  // Case D: anonymous count stepper
  const [anonCount, setAnonCount] = useState(0);

  const selectedMembers = useMemo(() => groupMembers.filter(m => selected.has(m.id)), [groupMembers, selected]);

  // Total headcount including guests and anon
  const totalHeadcount = selectedMembers.length + guests.length + anonCount;

  const memberSplits = useMemo(() => {
    const result: Record<string, number> = {};
    if (selectedMembers.length === 0) return result;

    if (mode === "equal") {
      if (totalHeadcount === 0) return result;
      const perPerson = Math.floor(totalAmount / totalHeadcount);
      const remainder = totalAmount - perPerson * totalHeadcount;
      selectedMembers.forEach((m, i) => {
        result[m.id] = perPerson + (i < remainder ? 1 : 0);
      });
    } else {
      selectedMembers.forEach(m => {
        result[m.id] = parseInt(customAmounts[m.id] || "0", 10) || 0;
      });
    }
    return result;
  }, [mode, selectedMembers, customAmounts, totalAmount, totalHeadcount]);

  // Compute equal per-person for display in equal mode
  const equalPerPerson = totalHeadcount > 0 ? Math.floor(totalAmount / totalHeadcount) : 0;

  // Guest splits: in equal mode derive from equalPerPerson; in custom use their stored amount
  const resolvedGuests: GuestSplit[] = useMemo(() => {
    if (mode === "equal") {
      return guests.map(g => ({ name: g.name, amount: equalPerPerson }));
    }
    return guests;
  }, [mode, guests, equalPerPerson]);

  // Anon: in equal mode derive amount per anon from equalPerPerson
  const resolvedAnon: AnonSplit | null = anonCount > 0
    ? { count: anonCount, amountEach: mode === "equal" ? equalPerPerson : equalPerPerson }
    : null;

  const totalMemberSplit = Object.values(memberSplits).reduce((s, v) => s + v, 0);
  const totalGuestSplit = resolvedGuests.reduce((s, g) => s + g.amount, 0);
  const totalAnonSplit = resolvedAnon ? resolvedAnon.count * resolvedAnon.amountEach : 0;
  const totalSplit = totalMemberSplit + totalGuestSplit + totalAnonSplit;
  const remaining = totalAmount - totalSplit;

  const canConfirm = totalHeadcount > 0 && (mode === "equal" || remaining === 0);

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

  function handleAmountChange(memberId: string, value: string) {
    const raw = value.replace(/\D/g, "");
    setCustomAmounts(prev => ({ ...prev, [memberId]: raw }));
    if (mode === "equal") setMode("custom");
  }

  function addGuest() {
    const name = guestInput.trim();
    if (!name) return;
    const amount = mode === "equal" ? equalPerPerson : (parseInt(guestAmountInput.replace(/\D/g, ""), 10) || 0);
    setGuests(prev => [...prev, { name, amount }]);
    setGuestInput("");
    setGuestAmountInput("");
  }

  function removeGuest(idx: number) {
    setGuests(prev => prev.filter((_, i) => i !== idx));
  }

  const overageText = remaining < 0
    ? `Vượt ${formatVND(Math.abs(remaining))}đ`
    : remaining > 0 ? `Còn ${formatVND(remaining)}đ` : null;

  const modes: { key: SplitMode; label: string }[] = [
    { key: "equal", label: "Chia đều" },
    { key: "custom", label: "Chia không đều" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        <div className="flex shrink-0 justify-center py-2">
          <div className="h-1 w-9 rounded-full bg-[#D1D1D6]" />
        </div>

        <div className="flex shrink-0 items-center justify-between px-5 pb-3">
          <h2 className="text-[17px] font-bold text-[#1C1C1E]">Chọn người & số tiền</h2>
          <button type="button" onClick={onClose} className="text-base text-[#AEAEB2]" aria-label="Đóng">✕</button>
        </div>

        {/* Mode tabs */}
        <div className="flex shrink-0 gap-2 px-5 pb-3">
          {modes.map(m => (
            <button key={m.key} type="button" onClick={() => setMode(m.key)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${mode === m.key ? "bg-[#EEF2FF] text-[#3A5CCC]" : "bg-[#F2F2F7] text-[#8E8E93]"}`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Search filter — AC-E3-2.11 */}
        <div className="shrink-0 px-5 pb-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm thành viên..."
            className="w-full rounded-full border border-[#E5E5EA] bg-[#F2F2F7] px-4 py-2 text-[13px] outline-none focus:border-[#3A5CCC]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5">
          {/* Member rows */}
          {filteredMembers.map(m => {
            const isSelected = selected.has(m.id);
            const equalAmt = memberSplits[m.id] ?? 0;
            const bg = getAvatarColor(m.display_name);
            const initial = (m.display_name.charAt(0) || "?").toUpperCase();
            const isPayer = m.id === payerId;

            return (
              <div key={m.id} className="flex h-[60px] items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: bg }}>
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[15px] font-semibold ${isSelected ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}>
                    {m.display_name}
                  </span>
                  {isPayer && <span className="ml-1 text-[11px] text-[#AEAEB2]">· người trả</span>}
                </div>
                {mode === "equal" ? (
                  <span className="rounded-[8px] bg-[#F2F2F7] px-3 py-1.5 text-[13px] font-medium text-[#1C1C1E]">
                    {isSelected ? `${formatVND(equalAmt)}đ` : "—"}
                  </span>
                ) : (
                  <input type="text" inputMode="numeric" value={customAmounts[m.id] || ""}
                    onChange={e => handleAmountChange(m.id, e.target.value)}
                    placeholder="0đ" disabled={!isSelected}
                    className="w-20 rounded-[8px] bg-[#F2F2F7] px-3 py-1.5 text-right text-[13px] font-medium text-[#1C1C1E] outline-none disabled:text-[#AEAEB2]" />
                )}
                <button type="button" onClick={() => toggleMember(m.id)}
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded ${isSelected ? "bg-[#3A5CCC]" : "border-[1.5px] border-[#D1D1D6]"}`}>
                  {isSelected && <span className="text-xs font-bold text-white">✓</span>}
                </button>
              </div>
            );
          })}

          {/* Case C: Named guests section */}
          <div className="mt-3 border-t border-[#E5E5EA] pt-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8E8E93]">
              Khách (Case C) · không có tài khoản NoPay
            </p>

            {/* Existing guests */}
            {guests.map((g, idx) => (
              <div key={idx} className="flex h-[52px] items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF9500] text-sm font-bold text-white">
                  {(g.name.charAt(0) || "K").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[15px] font-semibold text-[#1C1C1E]">{g.name}</span>
                  <span className="ml-1 text-[11px] text-[#AEAEB2]">· khách</span>
                </div>
                <span className="rounded-[8px] bg-[#FFF3E0] px-3 py-1.5 text-[13px] font-medium text-[#FF9500]">
                  {formatVND(mode === "equal" ? equalPerPerson : g.amount)}đ
                </span>
                <button type="button" onClick={() => removeGuest(idx)}
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#FF3B30] text-[10px] font-bold text-white">
                  ✕
                </button>
              </div>
            ))}

            {/* Add guest input row */}
            <div className="flex items-center gap-2 pb-1 pt-1">
              <input type="text" value={guestInput} onChange={e => setGuestInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addGuest()}
                placeholder="Tên khách..."
                className="min-w-0 flex-1 rounded-[10px] border border-[#E5E5EA] bg-[#F2F2F7] px-3 py-2 text-[13px] outline-none focus:border-[#3A5CCC]" />
              {mode === "custom" && (
                <input type="text" inputMode="numeric" value={guestAmountInput}
                  onChange={e => setGuestAmountInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="0đ"
                  className="w-20 rounded-[10px] border border-[#E5E5EA] bg-[#F2F2F7] px-3 py-2 text-right text-[13px] outline-none focus:border-[#3A5CCC]" />
              )}
              <button type="button" onClick={addGuest}
                className="shrink-0 rounded-[10px] bg-[#3A5CCC] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                disabled={!guestInput.trim()}>
                Thêm
              </button>
            </div>
          </div>

          {/* Case D: Anonymous participants stepper */}
          <div className="mt-3 border-t border-[#E5E5EA] pt-3 pb-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8E8E93]">
              Vãng lai (Case D) · không lưu tên
            </p>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#1C1C1E]">+ N người vãng lai</p>
                {anonCount > 0 && (
                  <p className="text-[12px] text-[#8E8E93]">
                    {anonCount} người · {formatVND(equalPerPerson)}đ/người (tự track ngoài)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setAnonCount(c => Math.max(0, c - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5EA] text-[18px] font-bold text-[#3A5CCC] disabled:opacity-30"
                  disabled={anonCount === 0}>
                  −
                </button>
                <span className="w-6 text-center text-[15px] font-bold text-[#1C1C1E]">{anonCount}</span>
                <button type="button"
                  onClick={() => setAnonCount(c => Math.min(20, c + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5EA] text-[18px] font-bold text-[#3A5CCC] disabled:opacity-30"
                  disabled={anonCount === 20}>
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#E5E5EA] px-5 pt-3 pb-4">
          {mode === "custom" && (
            <div className="flex items-center justify-between pb-2">
              <span className="text-[13px] text-[#8E8E93]">Còn lại chưa chia</span>
              <span className={`text-[13px] font-semibold ${remaining === 0 ? "text-[#34C759]" : remaining < 0 ? "text-[#FF3B30]" : "text-[#FF9500]"}`}>
                {remaining === 0 ? "Khớp ✓" : overageText}
              </span>
            </div>
          )}

          {/* Headcount summary */}
          {totalHeadcount > 0 && (
            <div className="flex items-center justify-between pb-2">
              <span className="text-[12px] text-[#8E8E93]">
                {selectedMembers.length} thành viên
                {guests.length > 0 && ` + ${guests.length} khách`}
                {anonCount > 0 && ` + ${anonCount} vãng lai`}
                {` = ${totalHeadcount} người`}
              </span>
              {mode === "equal" && (
                <span className="text-[12px] font-semibold text-[#3A5CCC]">{formatVND(equalPerPerson)}đ/người</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pb-3">
            <span className="text-[15px] font-semibold text-[#1C1C1E]">Tổng bill</span>
            <span className="text-[15px] font-bold text-[#1C1C1E]">{formatVND(totalAmount)}đ</span>
          </div>

          <button type="button"
            onClick={() => canConfirm && onConfirm(memberSplits, resolvedGuests, resolvedAnon)}
            disabled={!canConfirm}
            className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[17px] font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-50">
            Xác nhận
          </button>
        </div>
      </div>
    </>
  );
}
