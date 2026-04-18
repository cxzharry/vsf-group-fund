"use client";

// Multi-hop settle-up payment page with partial-direct fallback.
// Modes:
//   - 'multihop' (default): pay the full multi-hop net amount. Rewrites debts so
//     counterparty absorbs user's 3rd-party obligations/receivables.
//   - 'direct':   pay any amount ≤ direct pair gross (sum of user→counterparty).
//     Greedy closes user's direct owing debts; doesn't touch offset or 3rd-parties.
// Race guard: refetches fresh debts right before mutation. Aborts if plan changed.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { formatVND } from "@/lib/format-vnd";
import {
  generateVietQRUrl,
  generateBankDeepLink,
  generateTransferDescription,
} from "@/lib/vietqr";
import { toast } from "sonner";
import { simplifyDebts, transfersForMember } from "@/lib/debt-simplifier";
import type { Member } from "@/lib/types";

interface RawDebt {
  id: string;
  debtor_id: string;
  creditor_id: string;
  remaining: number;
  bill_id: string;
}

type Mode = "multihop" | "direct";

/** Fetch pending/partial debts in this group. Shared between initial load + race refetch. */
async function fetchGroupDebts(
  supabase: ReturnType<typeof createBrowserClient>,
  groupId: string
): Promise<RawDebt[]> {
  const { data } = await supabase
    .from("debts")
    .select("id, debtor_id, creditor_id, remaining, bill_id, bills!inner(group_id)")
    .eq("bills.group_id", groupId)
    .in("status", ["pending", "partial"]);
  return (data ?? []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    debtor_id: d.debtor_id as string,
    creditor_id: d.creditor_id as string,
    remaining: d.remaining as number,
    bill_id: d.bill_id as string,
  }));
}

function computePlan(
  debts: RawDebt[],
  meId: string,
  cpId: string
): { amount: number; direction: "outgoing" | "incoming" | "none" } {
  const transfers = simplifyDebts(debts);
  const mine = transfersForMember(transfers, meId);
  const out = mine.outgoing.find((t) => t.to === cpId);
  if (out) return { amount: out.amount, direction: "outgoing" };
  const inc = mine.incoming.find((t) => t.from === cpId);
  if (inc) return { amount: inc.amount, direction: "incoming" };
  return { amount: 0, direction: "none" };
}

function computeDirectPair(debts: RawDebt[], meId: string, cpId: string) {
  const owing = debts.filter((d) => d.debtor_id === meId && d.creditor_id === cpId);
  const offset = debts.filter((d) => d.creditor_id === meId && d.debtor_id === cpId);
  const gross = owing.reduce((s, d) => s + d.remaining, 0);
  const offsetSum = offset.reduce((s, d) => s + d.remaining, 0);
  return { gross, offsetSum, net: Math.max(0, gross - offsetSum), owing, offset };
}

export default function MultiHopSettlePage() {
  const { id, counterpartyId } = useParams<{ id: string; counterpartyId: string }>();
  const router = useRouter();
  const { member: currentMember } = useAuth();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [counterparty, setCounterparty] = useState<Member | null>(null);
  const [rawDebts, setRawDebts] = useState<RawDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("multihop");
  const [amountInput, setAmountInput] = useState<string>("");

  const load = useCallback(async () => {
    if (!currentMember) return;
    const [cpRes, debts] = await Promise.all([
      supabase.from("members").select("*").eq("id", counterpartyId).single(),
      fetchGroupDebts(supabase, id),
    ]);
    setCounterparty(cpRes.data ?? null);
    setRawDebts(debts);
    setLoading(false);
  }, [id, counterpartyId, supabase, currentMember]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const plan = useMemo(
    () => (currentMember ? computePlan(rawDebts, currentMember.id, counterpartyId) : { amount: 0, direction: "none" as const }),
    [rawDebts, currentMember, counterpartyId]
  );

  const directPair = useMemo(
    () => (currentMember ? computeDirectPair(rawDebts, currentMember.id, counterpartyId) : { gross: 0, offsetSum: 0, net: 0, owing: [], offset: [] }),
    [rawDebts, currentMember, counterpartyId]
  );

  // Seed amount input when user clicks direct mode (handler, not effect).
  function switchToDirect() {
    setMode("direct");
    if (!amountInput) setAmountInput(String(directPair.net || directPair.gross));
  }

  const directParsedAmount = useMemo(() => {
    const n = parseInt(amountInput.replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : Math.max(0, Math.min(n, directPair.gross));
  }, [amountInput, directPair.gross]);

  const effectiveAmount = mode === "multihop" ? plan.amount : directParsedAmount;

  const myInvolvedDebts = useMemo(
    () =>
      rawDebts.filter(
        (d) => d.debtor_id === currentMember?.id || d.creditor_id === currentMember?.id
      ),
    [rawDebts, currentMember]
  );

  const qrUrl = useMemo(() => {
    if (!counterparty || effectiveAmount === 0) return null;
    if (!counterparty.bank_name || !counterparty.bank_account_no || !counterparty.bank_account_name) return null;
    const desc = generateTransferDescription(
      mode === "multihop" ? "SETTLE" : "PARTIAL",
      currentMember?.display_name ?? "User"
    );
    return generateVietQRUrl({
      bankName: counterparty.bank_name,
      accountNo: counterparty.bank_account_no,
      accountName: counterparty.bank_account_name,
      amount: effectiveAmount,
      description: desc,
    });
  }, [counterparty, effectiveAmount, currentMember, mode]);

  const deepLink = useMemo(() => {
    if (!counterparty || effectiveAmount === 0) return null;
    if (!counterparty.bank_name || !counterparty.bank_account_no) return null;
    const desc = generateTransferDescription(
      mode === "multihop" ? "SETTLE" : "PARTIAL",
      currentMember?.display_name ?? "User"
    );
    return generateBankDeepLink({
      bankName: counterparty.bank_name,
      accountNo: counterparty.bank_account_no,
      amount: effectiveAmount,
      description: desc,
    });
  }, [counterparty, effectiveAmount, currentMember, mode]);

  /**
   * Multi-hop mutation: close direct pair + reassign 3rd-party debts to counterparty.
   * Called with FRESH debts after race re-validation.
   */
  async function applyMultiHopSettle(fresh: RawDebt[]) {
    const me = currentMember!.id;
    const cp = counterpartyId;
    const closeIds: string[] = [];
    const reassignDebtor: string[] = [];
    const reassignCreditor: string[] = [];
    const myDebts = fresh.filter((d) => d.debtor_id === me || d.creditor_id === me);
    for (const d of myDebts) {
      if (d.debtor_id === me && d.creditor_id === cp) closeIds.push(d.id);
      else if (d.debtor_id === cp && d.creditor_id === me) closeIds.push(d.id);
      else if (d.debtor_id === me) reassignDebtor.push(d.id);
      else if (d.creditor_id === me) reassignCreditor.push(d.id);
    }
    const tasks: Promise<{ error: unknown }>[] = [];
    if (closeIds.length > 0) {
      tasks.push(
        Promise.resolve(supabase.from("debts").update({ remaining: 0, status: "confirmed" }).in("id", closeIds))
      );
    }
    if (reassignDebtor.length > 0) {
      tasks.push(Promise.resolve(supabase.from("debts").update({ debtor_id: cp }).in("id", reassignDebtor)));
    }
    if (reassignCreditor.length > 0) {
      tasks.push(Promise.resolve(supabase.from("debts").update({ creditor_id: cp }).in("id", reassignCreditor)));
    }
    const results = await Promise.all(tasks);
    for (const r of results) if (r.error) throw r.error;
  }

  /**
   * Direct partial: greedily close user→counterparty owing debts up to `amount`.
   * Leaves offset debts untouched (user can settle those separately later).
   */
  async function applyDirectPartial(amount: number, owingDirect: RawDebt[]) {
    // Sort by id for determinism (any stable order works)
    const sorted = [...owingDirect].sort((a, b) => a.id.localeCompare(b.id));
    let left = amount;
    for (const d of sorted) {
      if (left <= 0) break;
      const closeBy = Math.min(left, d.remaining);
      const newRemaining = d.remaining - closeBy;
      const newStatus = newRemaining <= 0 ? "confirmed" : "partial";
      const { error } = await supabase
        .from("debts")
        .update({ remaining: newRemaining, status: newStatus })
        .eq("id", d.id);
      if (error) throw error;
      left -= closeBy;
    }
  }

  async function handleConfirm() {
    if (!currentMember) return;
    if (effectiveAmount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }
    setSubmitting(true);
    try {
      // Race guard: fetch fresh debts before mutating.
      const fresh = await fetchGroupDebts(supabase, id);
      const freshPlan = computePlan(fresh, currentMember.id, counterpartyId);
      const freshDirect = computeDirectPair(fresh, currentMember.id, counterpartyId);

      if (mode === "multihop") {
        if (freshPlan.direction !== "outgoing" || freshPlan.amount !== plan.amount) {
          toast.error(
            freshPlan.direction === "outgoing"
              ? `Kế hoạch đã đổi: ${formatVND(freshPlan.amount)}đ. Xác nhận lại.`
              : "Kế hoạch không còn hợp lệ."
          );
          setRawDebts(fresh);
          setSubmitting(false);
          return;
        }
        await applyMultiHopSettle(fresh);
      } else {
        if (effectiveAmount > freshDirect.gross) {
          toast.error(`Số nợ trực tiếp đã đổi: còn ${formatVND(freshDirect.gross)}đ.`);
          setRawDebts(fresh);
          setSubmitting(false);
          return;
        }
        await applyDirectPartial(effectiveAmount, freshDirect.owing);
      }

      // Insert transfer_card chat message
      await supabase.from("chat_messages").insert({
        group_id: id,
        sender_id: currentMember.id,
        message_type: "transfer_card",
        content:
          mode === "multihop"
            ? `Tất toán đa chặng: ${formatVND(effectiveAmount)}đ`
            : `Chuyển trực tiếp: ${formatVND(effectiveAmount)}đ`,
        metadata: {
          from_member_id: currentMember.id,
          to_member_id: counterpartyId,
          amount: effectiveAmount,
          description: mode === "multihop" ? "Tất toán đa chặng" : "Chuyển trực tiếp",
          settle_type: mode,
        },
      });

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer_sent",
          payload: {
            fromId: currentMember.id,
            toId: counterpartyId,
            amount: effectiveAmount,
            description: mode === "multihop" ? "Tất toán đa chặng" : "Chuyển trực tiếp",
            groupId: id,
          },
        }),
      }).catch(() => {});

      try {
        sessionStorage.removeItem("home_groups_v3");
        sessionStorage.removeItem(`group_detail_${id}`);
      } catch {}
      toast.success(mode === "multihop" ? "Đã tất toán đa chặng!" : "Đã chuyển!");
      router.push(`/groups/${id}`);
    } catch {
      toast.error("Lỗi tất toán");
      setSubmitting(false);
    }
  }

  function handleCopyAccount() {
    if (counterparty?.bank_account_no) {
      navigator.clipboard.writeText(counterparty.bank_account_no).then(() => toast.success("Đã copy STK"));
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
      </div>
    );
  }

  if (!counterparty) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-[#AEAEB2]">Không tìm thấy người nhận</p>
      </div>
    );
  }

  if (plan.direction === "incoming") {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7] px-6 text-center">
        <p className="text-sm text-[#AEAEB2]">
          {counterparty.display_name} sẽ chuyển bạn {formatVND(plan.amount)}đ. Hãy đợi họ tất toán.
        </p>
      </div>
    );
  }

  // If user has nothing multi-hop (plan=0) AND no direct gross, there's nothing to settle.
  if (plan.amount === 0 && directPair.gross === 0) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-[#AEAEB2]">Không cần chuyển tiền cho {counterparty.display_name}</p>
      </div>
    );
  }

  const cpInitials = counterparty.display_name
    ? counterparty.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const multiHopAvailable = plan.direction === "outgoing" && plan.amount > 0;
  const directAvailable = directPair.gross > 0;

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      <header className="flex h-[52px] shrink-0 items-center justify-between bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#636366] hover:bg-[#F2F2F7]"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <p className="text-sm font-semibold text-[#1C1C1E]">Tất toán</p>
          <p className="text-[11px] text-[#AEAEB2]">{counterparty.display_name}</p>
        </div>
        <div className="h-8 w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Mode tabs — only show if both modes available */}
        {multiHopAvailable && directAvailable && (
          <div className="flex gap-2 rounded-full bg-[#E5E5EA] p-1">
            <button
              type="button"
              onClick={() => setMode("multihop")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition-all ${
                mode === "multihop" ? "bg-white text-[#3A5CCC] shadow" : "text-[#636366]"
              }`}
            >
              Đa chặng (tất toán sạch)
            </button>
            <button
              type="button"
              onClick={switchToDirect}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition-all ${
                mode === "direct" ? "bg-white text-[#3A5CCC] shadow" : "text-[#636366]"
              }`}
            >
              Trực tiếp (1 phần)
            </button>
          </div>
        )}

        {/* Amount card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          {mode === "direct" ? (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-transparent text-center text-3xl font-bold text-[#1C1C1E] outline-none"
                placeholder="0"
              />
              <p className="mt-1 text-[11px] text-[#AEAEB2]">
                Tối đa {formatVND(directPair.gross)}đ (nợ trực tiếp)
              </p>
            </>
          ) : (
            <p className="text-3xl font-bold text-[#1C1C1E]">{formatVND(effectiveAmount)}đ</p>
          )}
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-sm text-[#8E8E93]">cho</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-[#3A5CCC]">
              {cpInitials}
            </div>
            <p className="text-sm font-semibold text-[#1C1C1E]">{counterparty.display_name}</p>
          </div>
          {mode === "multihop" && (
            <p className="mt-2 text-[11px] text-[#8A6D1F]">
              Đóng toàn bộ {myInvolvedDebts.length} nợ của bạn trong nhóm
            </p>
          )}
        </div>

        {/* QR card */}
        {counterparty.bank_name && counterparty.bank_account_no && effectiveAmount > 0 ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            {qrUrl && (
              <div className="mb-3 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="VietQR" className="h-48 w-48 rounded-xl object-contain" />
              </div>
            )}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#AEAEB2]">NH</span>
                <span className="font-medium text-[#1C1C1E]">{counterparty.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#AEAEB2]">STK</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[#1C1C1E]">{counterparty.bank_account_no}</span>
                  <button type="button" onClick={handleCopyAccount} className="text-base leading-none" aria-label="Copy STK">📋</button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#AEAEB2]">Chủ TK</span>
                <span className="font-medium text-[#1C1C1E]">{counterparty.bank_account_name}</span>
              </div>
            </div>
            {deepLink && (
              <a
                href={deepLink}
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-[#F2F2F7] py-2.5 text-xs font-medium text-[#1C1C1E] active:bg-[#F2F2F7]"
              >
                🏦 Mở app {counterparty.bank_name?.split(" ")[0] ?? "ngân hàng"}
              </a>
            )}
          </div>
        ) : effectiveAmount > 0 ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
            <p className="text-sm text-[#AEAEB2]">{counterparty.display_name} chưa cài ngân hàng</p>
          </div>
        ) : null}

        {/* Explain */}
        <div className="rounded-2xl bg-[#FFF9E6] p-3 text-[11px] leading-relaxed text-[#8A6D1F]">
          {mode === "multihop" ? (
            <>
              <p className="font-semibold">⚠️ Tất toán đa chặng</p>
              <p className="mt-1">
                Đóng mọi nợ của bạn trong nhóm. Các khoản bạn còn nợ/được nợ qua người khác sẽ chuyển giao cho {counterparty.display_name}. Kế hoạch tính lại mỗi lần bấm Đã chuyển.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">ℹ️ Trả một phần trực tiếp</p>
              <p className="mt-1">
                Chỉ giảm nợ trực tiếp bạn → {counterparty.display_name}. Không chạm khoản họ nợ bạn (nếu có) và không ảnh hưởng người khác.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-[#E5E5EA] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || effectiveAmount <= 0}
          className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[17px] font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đã chuyển"}
        </button>
      </div>
    </div>
  );
}
