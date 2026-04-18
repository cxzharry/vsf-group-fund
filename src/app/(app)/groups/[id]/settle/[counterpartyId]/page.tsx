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
  const [groupName, setGroupName] = useState<string>("");
  const [rawDebts, setRawDebts] = useState<RawDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("multihop");
  const [amountInput, setAmountInput] = useState<string>("");

  const load = useCallback(async () => {
    if (!currentMember) return;
    const [cpRes, groupRes, debts] = await Promise.all([
      supabase.from("members").select("*").eq("id", counterpartyId).single(),
      supabase.from("groups").select("name").eq("id", id).single(),
      fetchGroupDebts(supabase, id),
    ]);
    setCounterparty(cpRes.data ?? null);
    setGroupName(groupRes.data?.name ?? "");
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

  const bankChips = counterparty.bank_name
    ? [counterparty.bank_name.split(" ")[0], "VietcomBank", "Momo"]
    : ["MBBank", "VietcomBank", "Momo"];

  const qrDescription = generateTransferDescription(
    mode === "multihop" ? "SETTLE" : "PARTIAL",
    currentMember?.display_name ?? "User"
  );

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      {/* Nav bar */}
      <header className="flex h-[52px] shrink-0 items-center justify-between bg-white px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-6 w-6 items-center justify-center text-[#3A5CCC]"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <p className="text-[17px] font-bold text-black">Chuyển khoản</p>
        <div className="h-6 w-6" />
      </header>
      <div className="h-px w-full bg-[#E5E5EA]" />

      <div className="flex-1 overflow-y-auto bg-[#F2F2F7] px-4 py-5 space-y-4">
        {/* Mode tabs — my addition when both modes available */}
        {multiHopAvailable && directAvailable && (
          <div className="flex gap-1 rounded-full bg-[#E5E5EA] p-1">
            <button
              type="button"
              onClick={() => setMode("multihop")}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-all ${
                mode === "multihop" ? "bg-white text-[#3A5CCC] shadow-sm" : "text-[#636366]"
              }`}
            >
              Tất toán sạch
            </button>
            <button
              type="button"
              onClick={switchToDirect}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-all ${
                mode === "direct" ? "bg-white text-[#3A5CCC] shadow-sm" : "text-[#636366]"
              }`}
            >
              Trả 1 phần
            </button>
          </div>
        )}

        {/* Recipient card */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3A5CCC] text-base font-bold text-white">
              {cpInitials}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[15px] font-semibold text-black">Chuyển cho {counterparty.display_name}</p>
              {counterparty.bank_name && counterparty.bank_account_no && (
                <p className="text-[13px] text-[#8E8E93]">
                  {counterparty.bank_name} · {counterparty.bank_account_no}
                </p>
              )}
            </div>
          </div>
          {mode === "direct" ? (
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-transparent text-[36px] font-bold leading-tight text-black outline-none"
                placeholder="0đ"
              />
              <p className="mt-1 text-[11px] text-[#AEAEB2]">
                Tối đa {formatVND(directPair.gross)}đ nợ trực tiếp
              </p>
            </div>
          ) : (
            <p className="text-[36px] font-bold leading-tight text-black">{formatVND(effectiveAmount)}đ</p>
          )}
          {groupName && (
            <p className="text-[13px] text-[#8E8E93]">
              {mode === "multihop" ? `Tất toán đa chặng trong nhóm ${groupName}` : `Nợ nhóm ${groupName}`}
            </p>
          )}
        </div>

        {/* QR card */}
        {counterparty.bank_name && counterparty.bank_account_no && effectiveAmount > 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5">
            <p className="text-[13px] text-[#8E8E93]">Quét QR để chuyển tiền</p>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="VietQR"
                className="h-[180px] w-[180px] rounded-xl border border-[#E5E5EA] object-contain"
              />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl border border-[#E5E5EA] bg-[#F2F2F7]">
                <span className="text-4xl text-[#AEAEB2]">⋯</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {bankChips.map((label, i) => (
                <span
                  key={i}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                    label === "Momo" ? "bg-[#FFF0F0] text-[#D91C5C]" : "bg-[#EEF2FF] text-[#3A5CCC]"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : effectiveAmount > 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center">
            <p className="text-sm text-[#AEAEB2]">{counterparty.display_name} chưa cài ngân hàng</p>
          </div>
        ) : null}

        {/* Bank info card */}
        {counterparty.bank_name && counterparty.bank_account_no && (
          <div className="flex flex-col gap-2 rounded-[14px] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-black">Thông tin chuyển khoản</p>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="flex h-[18px] w-[18px] items-center justify-center text-[#3A5CCC]"
                aria-label="Copy STK"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="currentColor" className="h-[18px] w-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
              </button>
            </div>
            <div className="flex h-9 items-center justify-between">
              <span className="text-[13px] text-[#8E8E93]">Ngân hàng</span>
              <span className="text-[13px] font-bold text-black">{counterparty.bank_name}</span>
            </div>
            <div className="flex h-9 items-center justify-between">
              <span className="text-[13px] text-[#8E8E93]">Số tài khoản</span>
              <span className="text-[13px] font-bold text-black">{counterparty.bank_account_no}</span>
            </div>
            <div className="flex h-9 items-center justify-between">
              <span className="text-[13px] text-[#8E8E93]">Chủ tài khoản</span>
              <span className="text-[13px] font-bold text-black">{counterparty.bank_account_name}</span>
            </div>
            <div className="flex h-9 items-center justify-between">
              <span className="text-[13px] text-[#8E8E93]">Nội dung</span>
              <span className="text-[13px] font-bold text-black">{qrDescription}</span>
            </div>
            {deepLink && (
              <a
                href={deepLink}
                className="mt-2 flex h-10 items-center justify-center gap-1 rounded-xl bg-[#F2F2F7] text-[13px] font-medium text-[#1C1C1E]"
              >
                🏦 Mở app {counterparty.bank_name.split(" ")[0]}
              </a>
            )}
          </div>
        )}

        {/* Explain — compact */}
        <p className="px-1 text-[11px] leading-relaxed text-[#8A6D1F]">
          {mode === "multihop"
            ? `Đóng mọi nợ của bạn trong nhóm. Các khoản qua trung gian chuyển giao cho ${counterparty.display_name}. Kế hoạch tính lại mỗi lần bấm.`
            : `Chỉ giảm nợ trực tiếp bạn → ${counterparty.display_name}. Không ảnh hưởng khoản qua người khác.`}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col gap-3 bg-white px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || effectiveAmount <= 0}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[16px] font-bold text-white transition-opacity active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full text-center text-[15px] text-[#8E8E93]"
        >
          Hủy thanh toán
        </button>
      </div>
    </div>
  );
}
