"use client";

// Multi-hop settle-up payment page.
// Closes user's FULL participation in the group when they pay the counterparty
// the multi-hop net amount. Rewrites debts where user is debtor/creditor with
// third-parties so counterparty absorbs the middleman role.

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

  const load = useCallback(async () => {
    if (!currentMember) return;
    const [cpRes, debtsRes] = await Promise.all([
      supabase.from("members").select("*").eq("id", counterpartyId).single(),
      supabase
        .from("debts")
        .select("id, debtor_id, creditor_id, remaining, bill_id, bills!inner(group_id)")
        .eq("bills.group_id", id)
        .in("status", ["pending", "partial"]),
    ]);
    setCounterparty(cpRes.data ?? null);
    setRawDebts(
      (debtsRes.data ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        debtor_id: d.debtor_id as string,
        creditor_id: d.creditor_id as string,
        remaining: d.remaining as number,
        bill_id: d.bill_id as string,
      }))
    );
    setLoading(false);
  }, [id, counterpartyId, supabase, currentMember]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  // Recompute plan every render — matches user's invariant:
  // "settlement plan được tính lại mỗi lần có người chuyển đi".
  const plan = useMemo(() => {
    if (!currentMember) return { amount: 0, direction: "none" as const };
    const transfers = simplifyDebts(rawDebts);
    const mine = transfersForMember(transfers, currentMember.id);
    const out = mine.outgoing.find((t) => t.to === counterpartyId);
    if (out) return { amount: out.amount, direction: "outgoing" as const };
    const inc = mine.incoming.find((t) => t.from === counterpartyId);
    if (inc) return { amount: inc.amount, direction: "incoming" as const };
    return { amount: 0, direction: "none" as const };
  }, [rawDebts, currentMember, counterpartyId]);

  // Debts involving current user (either side) in this group — subject to settle.
  const myInvolvedDebts = useMemo(
    () =>
      rawDebts.filter(
        (d) => d.debtor_id === currentMember?.id || d.creditor_id === currentMember?.id
      ),
    [rawDebts, currentMember]
  );

  const qrUrl = useMemo(() => {
    if (!counterparty || plan.direction !== "outgoing" || plan.amount === 0) return null;
    if (!counterparty.bank_name || !counterparty.bank_account_no || !counterparty.bank_account_name) return null;
    const desc = generateTransferDescription("SETTLE", currentMember?.display_name ?? "User");
    return generateVietQRUrl({
      bankName: counterparty.bank_name,
      accountNo: counterparty.bank_account_no,
      accountName: counterparty.bank_account_name,
      amount: plan.amount,
      description: desc,
    });
  }, [counterparty, plan, currentMember]);

  const deepLink = useMemo(() => {
    if (!counterparty || plan.direction !== "outgoing" || plan.amount === 0) return null;
    if (!counterparty.bank_name || !counterparty.bank_account_no) return null;
    const desc = generateTransferDescription("SETTLE", currentMember?.display_name ?? "User");
    return generateBankDeepLink({
      bankName: counterparty.bank_name,
      accountNo: counterparty.bank_account_no,
      amount: plan.amount,
      description: desc,
    });
  }, [counterparty, plan, currentMember]);

  /**
   * Apply multi-hop settlement mutations to debts:
   * - Pair (user ↔ counterparty): close (remaining=0, status=confirmed).
   * - User owes third-party Z: transfer obligation to counterparty (debtor_id = counterparty).
   * - Third-party Z owes user: transfer receivable to counterparty (creditor_id = counterparty).
   * Bill traceability preserved — only counterparty fields shift.
   */
  async function applyMultiHopSettle() {
    if (!currentMember) return;
    const me = currentMember.id;
    const cp = counterpartyId;

    const closeIds: string[] = [];
    const reassignDebtor: string[] = []; // set debtor_id = cp
    const reassignCreditor: string[] = []; // set creditor_id = cp

    for (const d of myInvolvedDebts) {
      if (d.debtor_id === me && d.creditor_id === cp) closeIds.push(d.id);
      else if (d.debtor_id === cp && d.creditor_id === me) closeIds.push(d.id);
      else if (d.debtor_id === me) reassignDebtor.push(d.id); // me → Z becomes cp → Z
      else if (d.creditor_id === me) reassignCreditor.push(d.id); // Z → me becomes Z → cp
    }

    // Run the three mutations — separate queries because values differ.
    // Wrap with Promise.resolve so Supabase builder (thenable) composes with Promise.all typing.
    const tasks: Promise<{ error: unknown }>[] = [];
    if (closeIds.length > 0) {
      tasks.push(
        Promise.resolve(
          supabase.from("debts").update({ remaining: 0, status: "confirmed" }).in("id", closeIds)
        )
      );
    }
    if (reassignDebtor.length > 0) {
      tasks.push(
        Promise.resolve(supabase.from("debts").update({ debtor_id: cp }).in("id", reassignDebtor))
      );
    }
    if (reassignCreditor.length > 0) {
      tasks.push(
        Promise.resolve(supabase.from("debts").update({ creditor_id: cp }).in("id", reassignCreditor))
      );
    }
    const results = await Promise.all(tasks);
    for (const r of results) {
      if (r.error) throw r.error;
    }
  }

  async function handleConfirm() {
    if (!currentMember || plan.direction !== "outgoing") return;
    setSubmitting(true);
    try {
      await applyMultiHopSettle();

      // Insert transfer_card chat message for group visibility
      await supabase.from("chat_messages").insert({
        group_id: id,
        sender_id: currentMember.id,
        message_type: "transfer_card",
        content: `Tất toán đa chặng: ${formatVND(plan.amount)}đ`,
        metadata: {
          from_member_id: currentMember.id,
          to_member_id: counterpartyId,
          amount: plan.amount,
          description: "Tất toán đa chặng",
          settle_type: "multi_hop",
        },
      });

      // Fire Telegram notification
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer_sent",
          payload: {
            fromId: currentMember.id,
            toId: counterpartyId,
            amount: plan.amount,
            description: "Tất toán đa chặng",
            groupId: id,
          },
        }),
      }).catch(() => {});

      try {
        sessionStorage.removeItem("home_groups_v3");
        sessionStorage.removeItem(`group_detail_${id}`);
      } catch {}
      toast.success("Đã tất toán đa chặng!");
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

  if (plan.direction === "none" || plan.amount === 0) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-[#AEAEB2]">Không cần chuyển tiền cho {counterparty.display_name}</p>
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

  const cpInitials = counterparty.display_name
    ? counterparty.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

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
          <p className="text-sm font-semibold text-[#1C1C1E]">Tất toán đa chặng</p>
          <p className="text-[11px] text-[#AEAEB2]">Gộp toàn bộ nợ của bạn trong nhóm</p>
        </div>
        <div className="h-8 w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Amount card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-[#1C1C1E]">{formatVND(plan.amount)}đ</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-sm text-[#8E8E93]">cho</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-[#3A5CCC]">
              {cpInitials}
            </div>
            <p className="text-sm font-semibold text-[#1C1C1E]">{counterparty.display_name}</p>
          </div>
          <p className="mt-2 text-[11px] text-[#8A6D1F]">
            Đóng {myInvolvedDebts.length} khoản nợ của bạn trong nhóm
          </p>
        </div>

        {/* QR card */}
        {counterparty.bank_name && counterparty.bank_account_no ? (
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
        ) : (
          <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
            <p className="text-sm text-[#AEAEB2]">
              {counterparty.display_name} chưa cài ngân hàng
            </p>
          </div>
        )}

        {/* Explain multi-hop */}
        <div className="rounded-2xl bg-[#FFF9E6] p-3 text-[11px] leading-relaxed text-[#8A6D1F]">
          <p className="font-semibold">⚠️ Tất toán đa chặng</p>
          <p className="mt-1">
            Khi bấm <b>Đã chuyển</b>: các khoản nợ trực tiếp giữa bạn và {counterparty.display_name} sẽ đóng. Các khoản bạn còn nợ/được nợ qua người khác sẽ chuyển giao cho {counterparty.display_name} (họ thay bạn đòi/trả).
          </p>
        </div>
      </div>

      <div className="border-t border-[#E5E5EA] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[17px] font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đã chuyển"}
        </button>
      </div>
    </div>
  );
}
