"use client";

import { useEffect, useState } from "react";
import { formatVND } from "@/lib/format-vnd";
import { simplifyDebtsGraph, computeNetBalances, type RawDebt } from "@/lib/simplify-debts";
import type { Member } from "@/lib/types";

interface Props {
  debts: RawDebt[];
  members: Member[];
}

const STORAGE_KEY = "debtViewMode";

function getAvatar(name: string) {
  return name.charAt(0).toUpperCase();
}

export function DebtBalancesView({ debts, members }: Props) {
  // Persist toggle in localStorage
  const [simplified, setSimplified] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "simplified";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, simplified ? "simplified" : "balances");
  }, [simplified]);

  const memberMap = new Map<string, Member>(members.map((m) => [m.id, m]));

  // ── balances view ─────────────────────────────────────────────────────────

  const netBalances = computeNetBalances(debts);

  // Collect all member ids that appear in debts or are passed in
  const relevantIds = new Set<string>();
  for (const d of debts) {
    relevantIds.add(d.debtor_id);
    relevantIds.add(d.creditor_id);
  }

  // Build per-member helper text (how many they owe / are owed by)
  function helperText(memberId: string): string {
    const owedBy = debts.filter((d) => d.creditor_id === memberId && d.debtor_id !== memberId).length;
    const owes = debts.filter((d) => d.debtor_id === memberId && d.creditor_id !== memberId).length;
    if (owedBy > 0 && owes > 0) return `${owedBy} người nợ · nợ ${owes} người`;
    if (owedBy > 0) return `Được ${owedBy} người nợ`;
    if (owes > 0) return `Nợ ${owes} người`;
    return "";
  }

  // ── simplified transactions view ──────────────────────────────────────────

  const simplifiedDebts = simplifyDebtsGraph(debts);

  // ── empty state ───────────────────────────────────────────────────────────

  const hasData = debts.length > 0;

  return (
    <div className="rounded-[14px] bg-white shadow-sm overflow-hidden">
      {/* Section header with toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
        <p className="text-sm font-semibold text-[#1C1C1E]">Ai nợ ai</p>
        <button
          type="button"
          onClick={() => setSimplified((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            simplified ? "bg-[#3A5CCC]" : "bg-[#E5E5EA]"
          }`}
          role="switch"
          aria-checked={simplified}
          aria-label="Hiển thị nợ đơn giản hoá"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              simplified ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Toggle label */}
      <div className="px-4 py-2 border-b border-[#E5E5EA] bg-[#F9F9FB]">
        <p className="text-xs text-[#8E8E93]">
          {simplified ? "Hiển thị nợ đơn giản hoá" : "Số dư thành viên"}
        </p>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p className="text-sm font-medium text-[#8E8E93]">Chưa có giao dịch nào trong nhóm</p>
        </div>
      ) : simplified ? (
        /* Simplified transactions */
        simplifiedDebts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <p className="text-sm font-medium text-[#34C759]">Mọi người đã cân bằng nhau!</p>
          </div>
        ) : (
          simplifiedDebts.map((sd, idx) => {
            const debtor = memberMap.get(sd.debtor_id);
            const creditor = memberMap.get(sd.creditor_id);
            return (
              <div
                key={`${sd.debtor_id}-${sd.creditor_id}-${idx}`}
                className={`flex items-center justify-between px-4 py-3 ${
                  idx < simplifiedDebts.length - 1 ? "border-b border-[#E5E5EA]" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Debtor avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-xs font-bold text-[#FF3B30]">
                    {getAvatar(debtor?.display_name ?? "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1C1C1E] truncate">
                      {debtor?.display_name ?? sd.debtor_id}
                    </p>
                    <p className="text-xs text-[#8E8E93]">nợ</p>
                  </div>
                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {/* Creditor avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#34C759]/10 text-xs font-bold text-[#34C759]">
                    {getAvatar(creditor?.display_name ?? "?")}
                  </div>
                  <p className="text-sm font-medium text-[#1C1C1E] truncate">
                    {creditor?.display_name ?? sd.creditor_id}
                  </p>
                </div>
                <p className="ml-2 shrink-0 text-sm font-semibold text-[#FF3B30]">
                  {formatVND(sd.amount)}đ
                </p>
              </div>
            );
          })
        )
      ) : (
        /* Balances list */
        Array.from(relevantIds).map((memberId, idx, arr) => {
          const member = memberMap.get(memberId);
          const net = netBalances.get(memberId) ?? 0;
          const helper = helperText(memberId);
          const isCreditor = net > 500;
          const isDebtor = net < -500;
          const isSettled = !isCreditor && !isDebtor;

          return (
            <div
              key={memberId}
              className={`flex items-center justify-between px-4 py-3 ${
                idx < arr.length - 1 ? "border-b border-[#E5E5EA]" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3A5CCC]/10 text-sm font-bold text-[#3A5CCC]">
                  {getAvatar(member?.display_name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1C1C1E] truncate">
                    {member?.display_name ?? memberId}
                  </p>
                  {helper && (
                    <p className="text-xs text-[#AEAEB2] truncate">{helper}</p>
                  )}
                </div>
              </div>

              <div className="ml-2 shrink-0 text-right">
                {isSettled ? (
                  <p className="text-sm font-medium text-[#8E8E93]">Đã cân</p>
                ) : isCreditor ? (
                  <p className="text-sm font-semibold text-[#34C759]">+{formatVND(net)}đ</p>
                ) : (
                  <p className="text-sm font-semibold text-[#FF3B30]">{formatVND(net)}đ</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
