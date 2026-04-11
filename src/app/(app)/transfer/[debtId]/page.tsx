"use client";

// Full payment screen: VietQR + transfer actions for a specific debt
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
import type { Debt, Member, Bill } from "@/lib/types";

export default function TransferPage() {
  const { debtId } = useParams<{ debtId: string }>();
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

  const [debt, setDebt] = useState<Debt | null>(null);
  const [creditor, setCreditor] = useState<Member | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const { data: debtData } = await supabase
      .from("debts")
      .select("*")
      .eq("id", debtId)
      .single();

    if (!debtData) { setLoading(false); return; }
    setDebt(debtData);

    const [{ data: creditorData }, { data: billData }] = await Promise.all([
      supabase.from("members").select("*").eq("id", debtData.creditor_id).single(),
      supabase.from("bills").select("*").eq("id", debtData.bill_id).single(),
    ]);

    setCreditor(creditorData);
    setBill(billData);
    setLoading(false);
  }, [debtId, supabase]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const qrUrl = useMemo(() => {
    if (!creditor || !debt) return null;
    if (!creditor.bank_name || !creditor.bank_account_no || !creditor.bank_account_name) return null;
    const desc = generateTransferDescription(debt.bill_id, currentMember?.display_name ?? "User");
    return generateVietQRUrl({
      bankName: creditor.bank_name,
      accountNo: creditor.bank_account_no,
      accountName: creditor.bank_account_name,
      amount: debt.remaining,
      description: desc,
    });
  }, [creditor, debt, currentMember]);

  const deepLink = useMemo(() => {
    if (!creditor || !debt) return null;
    if (!creditor.bank_name || !creditor.bank_account_no) return null;
    const desc = generateTransferDescription(debt.bill_id, currentMember?.display_name ?? "User");
    return generateBankDeepLink({
      bankName: creditor.bank_name,
      accountNo: creditor.bank_account_no,
      amount: debt.remaining,
      description: desc,
    });
  }, [creditor, debt, currentMember]);

  async function handleConfirmPayment() {
    if (!debt || !currentMember) return;
    setSubmitting(true);

    await supabase.from("payment_confirmations").insert({
      debt_id: debt.id,
      confirmed_by: "debtor",
      method: "manual_debtor",
      status: "pending",
    });

    toast.success("Đã xác nhận! Chờ người nhận xác nhận.");
    setSubmitting(false);
    router.back();
  }

  function handleCopyAccount() {
    if (creditor?.bank_account_no) {
      navigator.clipboard.writeText(creditor.bank_account_no).then(() => {
        toast.success("Đã copy STK");
      });
    }
  }

  function handleSaveQR() {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qr-transfer-${debtId}.png`;
    a.click();
  }

  function handleShareQR() {
    if (!qrUrl) return;
    if (navigator.share) {
      navigator.share({ url: qrUrl, title: "QR chuyển tiền" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(qrUrl).then(() => toast.success("Đã copy link QR"));
    }
  }

  const billDate = bill ? new Date(bill.created_at).toLocaleDateString("vi-VN") : "";

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-gray-400">Không tìm thấy khoản nợ</p>
      </div>
    );
  }

  const creditorInitials = creditor?.display_name
    ? creditor.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      {/* Nav bar */}
      <header className="flex h-[52px] shrink-0 items-center justify-between bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-900">Chuyển tiền</p>
          {bill && (
            <p className="text-[11px] text-gray-400">{bill.title} · {billDate}</p>
          )}
        </div>
        <div className="h-8 w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Amount card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">
            {formatVND(debt.remaining)}đ
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-sm text-gray-500">cho</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              {creditorInitials}
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {creditor?.display_name ?? "?"}
            </p>
          </div>
        </div>

        {/* QR card */}
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

            {/* Bank info */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">NH</span>
                <span className="font-medium text-gray-900">{creditor.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">STK</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900">{creditor.bank_account_no}</span>
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
                <span className="text-gray-400">Chủ TK</span>
                <span className="font-medium text-gray-900">{creditor.bank_account_name}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSaveQR}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 active:bg-gray-100"
              >
                <span className="text-lg">💾</span>
                Lưu QR
              </button>
              <button
                type="button"
                onClick={handleShareQR}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 active:bg-gray-100"
              >
                <span className="text-lg">📤</span>
                Chia sẻ
              </button>
              {deepLink && (
                <a
                  href={deepLink}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 active:bg-gray-100"
                >
                  <span className="text-lg">🏦</span>
                  {creditor.bank_name?.split(" ")[0] ?? "Bank"}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
            <p className="text-sm text-gray-400">
              {creditor?.display_name ?? "Người nhận"} chưa cài ngân hàng
            </p>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="border-t border-gray-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 space-y-2">
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={submitting}
          className="w-full rounded-2xl bg-[#3A5CCC] py-3.5 text-sm font-bold text-white shadow transition-opacity active:opacity-80 disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đã chuyển tiền"}
        </button>
        <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 py-1 text-sm text-gray-400">
          <span>📎</span>
          <span>Upload biên lai (tuỳ chọn)</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={() => toast.info("Tính năng upload biên lai sẽ sớm có")}
          />
        </label>
      </div>
    </div>
  );
}
