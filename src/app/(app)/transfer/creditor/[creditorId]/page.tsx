"use client";

// Aggregated per-creditor transfer page.
// Unlike /transfer/[debtId] (single debt), this page sums ALL pending/partial debts
// from current user → creditorId (optionally scoped to a specific group).
// Rationale: when user owes 900k across 3 bills to Minh, one QR with correct total
// + batch-settle matches the group-detail banner amount. No more 900 vs 400 mismatch.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { formatVND } from "@/lib/format-vnd";
import {
  generateVietQRUrl,
  generateBankDeepLink,
  generateTransferDescription,
} from "@/lib/vietqr";
import { toast } from "sonner";
import type { Debt, Member } from "@/lib/types";

interface DebtRow extends Pick<Debt, "id" | "remaining" | "bill_id"> {
  bills?: { group_id: string; title: string } | null;
}

export default function CreditorTransferPage() {
  const { creditorId } = useParams<{ creditorId: string }>();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("group");
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

  const [creditor, setCreditor] = useState<Member | null>(null);
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!currentMember) return;

    // Fetch creditor + pending debts in parallel
    // When groupId provided, filter via bills!inner join so we only sum debts in that group
    const [creditorRes, debtsRes] = await Promise.all([
      supabase.from("members").select("*").eq("id", creditorId).single(),
      groupId
        ? supabase
            .from("debts")
            .select("id, remaining, bill_id, bills!inner(group_id, title)")
            .eq("debtor_id", currentMember.id)
            .eq("creditor_id", creditorId)
            .eq("bills.group_id", groupId)
            .in("status", ["pending", "partial"])
        : supabase
            .from("debts")
            .select("id, remaining, bill_id, bills(group_id, title)")
            .eq("debtor_id", currentMember.id)
            .eq("creditor_id", creditorId)
            .in("status", ["pending", "partial"]),
    ]);

    setCreditor(creditorRes.data ?? null);
    // bills relation returns array from supabase-js when not using !inner single; normalize
    const normalized = (debtsRes.data ?? []).map((d: Record<string, unknown>) => {
      const billsRaw = d.bills as { group_id: string; title: string } | { group_id: string; title: string }[] | null;
      const bills = Array.isArray(billsRaw) ? billsRaw[0] ?? null : billsRaw;
      return { id: d.id as string, remaining: d.remaining as number, bill_id: d.bill_id as string, bills };
    });
    setDebts(normalized);
    setLoading(false);
  }, [creditorId, groupId, supabase, currentMember]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const totalRemaining = useMemo(
    () => debts.reduce((s, d) => s + d.remaining, 0),
    [debts]
  );

  // QR description: use "many" marker since amount covers multiple bills
  const qrUrl = useMemo(() => {
    if (!creditor || totalRemaining === 0) return null;
    if (!creditor.bank_name || !creditor.bank_account_no || !creditor.bank_account_name) return null;
    const desc = generateTransferDescription(
      debts.length === 1 ? debts[0].bill_id : "MANY",
      currentMember?.display_name ?? "User"
    );
    return generateVietQRUrl({
      bankName: creditor.bank_name,
      accountNo: creditor.bank_account_no,
      accountName: creditor.bank_account_name,
      amount: totalRemaining,
      description: desc,
    });
  }, [creditor, totalRemaining, debts, currentMember]);

  const deepLink = useMemo(() => {
    if (!creditor || totalRemaining === 0) return null;
    if (!creditor.bank_name || !creditor.bank_account_no) return null;
    const desc = generateTransferDescription(
      debts.length === 1 ? debts[0].bill_id : "MANY",
      currentMember?.display_name ?? "User"
    );
    return generateBankDeepLink({
      bankName: creditor.bank_name,
      accountNo: creditor.bank_account_no,
      amount: totalRemaining,
      description: desc,
    });
  }, [creditor, totalRemaining, debts, currentMember]);

  async function handleConfirmPayment() {
    if (!currentMember || debts.length === 0) return;
    setSubmitting(true);

    // Batch-close all underlying debts — no creditor confirmation needed.
    const debtIds = debts.map((d) => d.id);
    const { error } = await supabase
      .from("debts")
      .update({ remaining: 0, status: "confirmed" })
      .in("id", debtIds);

    if (error) {
      toast.error("Lỗi đóng các khoản nợ");
      setSubmitting(false);
      return;
    }

    // Single aggregated Telegram message per creditor — avoids per-bill spam.
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_claim_batch",
        payload: { debtIds },
      }),
    }).catch(() => {});

    try {
      sessionStorage.removeItem("home_groups_v2");
      if (groupId) sessionStorage.removeItem(`group_detail_${groupId}`);
    } catch {}
    toast.success(`Đã đóng ${debts.length} khoản nợ!`);
    setSubmitting(false);
    router.back();
  }

  function handleCopyAccount() {
    if (creditor?.bank_account_no) {
      navigator.clipboard.writeText(creditor.bank_account_no).then(() => toast.success("Đã copy STK"));
    }
  }

  async function handleSaveQR() {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const filename = `vietqr-${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        navigator.canShare?.({ files: [file] }) &&
        "share" in navigator
      ) {
        await navigator.share({ files: [file], title: "VietQR chuyển tiền" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") toast.error("Không thể lưu QR");
    }
  }

  function handleShareQR() {
    if (!qrUrl) return;
    if (navigator.share) {
      navigator.share({ url: qrUrl, title: "QR chuyển tiền" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(qrUrl).then(() => toast.success("Đã copy link QR"));
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-[#AEAEB2]">Không còn khoản nợ nào</p>
      </div>
    );
  }

  const creditorInitials = creditor?.display_name
    ? creditor.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
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
          <p className="text-sm font-semibold text-[#1C1C1E]">Chuyển tiền</p>
          <p className="text-[11px] text-[#AEAEB2]">{debts.length} khoản gộp</p>
        </div>
        <div className="h-8 w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-[#1C1C1E]">
            {formatVND(totalRemaining)}đ
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-sm text-[#8E8E93]">cho</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-[#3A5CCC]">
              {creditorInitials}
            </div>
            <p className="text-sm font-semibold text-[#1C1C1E]">
              {creditor?.display_name ?? "?"}
            </p>
          </div>
        </div>

        {/* Breakdown of underlying debts */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-[#8E8E93]">Chi tiết</p>
          <div className="space-y-1.5">
            {debts.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-[#1C1C1E]">{d.bills?.title ?? "Bill"}</span>
                <span className="font-medium text-[#1C1C1E]">{formatVND(d.remaining)}đ</span>
              </div>
            ))}
          </div>
        </div>

        {creditor?.bank_name && creditor?.bank_account_no ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            {qrUrl && (
              <div className="mb-3 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="VietQR"
                  className="h-48 w-48 rounded-xl object-contain"
                />
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#AEAEB2]">NH</span>
                <span className="font-medium text-[#1C1C1E]">{creditor.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#AEAEB2]">STK</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[#1C1C1E]">{creditor.bank_account_no}</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="text-base leading-none"
                    aria-label="Copy STK"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#AEAEB2]">Chủ TK</span>
                <span className="font-medium text-[#1C1C1E]">{creditor.bank_account_name}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSaveQR}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#F2F2F7] py-2.5 text-xs font-medium text-[#1C1C1E] active:bg-[#F2F2F7]"
              >
                <span className="text-lg">💾</span>
                Lưu QR
              </button>
              <button
                type="button"
                onClick={handleShareQR}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#F2F2F7] py-2.5 text-xs font-medium text-[#1C1C1E] active:bg-[#F2F2F7]"
              >
                <span className="text-lg">📤</span>
                Chia sẻ
              </button>
              {deepLink && (
                <a
                  href={deepLink}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#F2F2F7] py-2.5 text-xs font-medium text-[#1C1C1E] active:bg-[#F2F2F7]"
                >
                  <span className="text-lg">🏦</span>
                  {creditor.bank_name?.split(" ")[0] ?? "Bank"}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
            <p className="text-sm text-[#AEAEB2]">
              {creditor?.display_name ?? "Người nhận"} chưa cài ngân hàng
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E5EA] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 space-y-2">
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={submitting}
          className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[17px] font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đã chuyển tiền"}
        </button>
      </div>
    </div>
  );
}
