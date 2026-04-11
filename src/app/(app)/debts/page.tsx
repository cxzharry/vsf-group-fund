"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVND } from "@/lib/format-vnd";
import { generateVietQRUrl, generateTransferDescription, generateBankDeepLink } from "@/lib/vietqr";
import type { Debt, Member } from "@/lib/types";

interface DebtWithNames extends Debt {
  debtor?: Member;
  creditor?: Member;
}

export default function DebtsPage() {
  const { member } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [debts, setDebts] = useState<DebtWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDebt, setQrDebt] = useState<DebtWithNames | null>(null);

  const loadDebts = useCallback(async () => {
    if (!member) return;

    const { data: memberData } = await supabase.from("members").select("*");
    const memberMap: Record<string, Member> = {};
    memberData?.forEach((m) => (memberMap[m.id] = m));

    const { data: debtData } = await supabase
      .from("debts")
      .select("*")
      .or(`debtor_id.eq.${member.id},creditor_id.eq.${member.id}`)
      .order("created_at", { ascending: false });

    setDebts(
      (debtData ?? []).map((d) => ({
        ...d,
        debtor: memberMap[d.debtor_id],
        creditor: memberMap[d.creditor_id],
      }))
    );
    setLoading(false);
  }, [member, supabase]);

  useEffect(() => {
    if (!member) return;

    // Initial load in a microtask to avoid synchronous setState in effect
    const timer = setTimeout(() => loadDebts(), 0);

    const channel = supabase
      .channel("debts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "debts" },
        () => loadDebts()
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [member, supabase, loadDebts]);

  // Separate: debts I owe vs debts owed to me
  const iOwe = debts.filter(
    (d) => d.debtor_id === member?.id && d.status !== "confirmed"
  );
  const owedToMe = debts.filter(
    (d) => d.creditor_id === member?.id && d.status !== "confirmed"
  );

  // Net balances per person
  const netBalances: Record<string, { name: string; amount: number }> = {};
  for (const d of debts) {
    if (d.status === "confirmed") continue;
    const otherId =
      d.debtor_id === member?.id ? d.creditor_id : d.debtor_id;
    const otherName =
      d.debtor_id === member?.id
        ? d.creditor?.display_name ?? "?"
        : d.debtor?.display_name ?? "?";
    const sign = d.debtor_id === member?.id ? -1 : 1;

    if (!netBalances[otherId]) netBalances[otherId] = { name: otherName, amount: 0 };
    netBalances[otherId].amount += sign * d.remaining;
  }

  const totalIOwe = iOwe.reduce((s, d) => s + d.remaining, 0);
  const totalOwedToMe = owedToMe.reduce((s, d) => s + d.remaining, 0);

  // QR URL for payment dialog
  const qrUrl =
    qrDebt?.creditor?.bank_name && qrDebt?.creditor?.bank_account_no
      ? generateVietQRUrl({
          bankName: qrDebt.creditor.bank_name,
          accountNo: qrDebt.creditor.bank_account_no,
          accountName: qrDebt.creditor.bank_account_name ?? "",
          amount: qrDebt.remaining,
          description: generateTransferDescription(
            qrDebt.bill_id,
            member?.display_name ?? ""
          ),
        })
      : null;

  // Deep link to open banking app directly
  const bankDeepLink =
    qrDebt?.creditor?.bank_name && qrDebt?.creditor?.bank_account_no
      ? generateBankDeepLink({
          bankName: qrDebt.creditor.bank_name,
          accountNo: qrDebt.creditor.bank_account_no,
          amount: qrDebt.remaining,
          description: generateTransferDescription(
            qrDebt.bill_id,
            member?.display_name ?? ""
          ),
        })
      : null;

  async function handleConfirmPaid(debt: DebtWithNames) {
    // Debtor self-confirm (Path 2: manual without screenshot)
    await supabase.from("payment_confirmations").insert({
      debt_id: debt.id,
      confirmed_by: "debtor",
      method: "manual_debtor",
      status: "pending",
    });

    // Notify creditor via Telegram
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_claim",
        payload: { debtId: debt.id, method: "manual_debtor" },
      }),
    }).catch(() => {});

    loadDebts();
  }

  async function handleCreditorConfirm(debt: DebtWithNames) {
    await supabase.from("payment_confirmations").insert({
      debt_id: debt.id,
      confirmed_by: "creditor",
      method: "manual_creditor",
      status: "confirmed",
    });

    await supabase
      .from("debts")
      .update({ remaining: 0, status: "confirmed" })
      .eq("id", debt.id);

    // Notify debtor via Telegram
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_confirmed",
        payload: { debtId: debt.id },
      }),
    }).catch(() => {});

    loadDebts();
  }

  return (
    <>
      <MobileHeader title="Nợ" />
      <main className="space-y-4 p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tôi nợ</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatVND(totalIOwe)}đ
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Nợ tôi</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatVND(totalOwedToMe)}đ
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Net balances */}
            {Object.keys(netBalances).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bù trừ</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(netBalances)
                    .sort((a, b) => a[1].amount - b[1].amount)
                    .map(([id, { name, amount }]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-sm">{name}</span>
                        <span
                          className={`text-sm font-medium ${
                            amount < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {amount < 0 ? "-" : "+"}
                          {formatVND(Math.abs(amount))}đ
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Debts I owe */}
            {iOwe.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">
                    Tôi đang nợ ({iOwe.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {iOwe.map((d) => (
                    <div key={d.id}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">
                            {d.creditor?.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatVND(d.remaining)}đ
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setQrDebt(d)}
                          >
                            QR
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 bg-orange-600 text-xs hover:bg-orange-700"
                            onClick={() =>
                              router.push(`/debts/${d.id}/confirm`)
                            }
                          >
                            Xác nhận
                          </Button>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Debts owed to me */}
            {owedToMe.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">
                    Người khác nợ tôi ({owedToMe.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {owedToMe.map((d) => (
                    <div key={d.id}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">
                            {d.debtor?.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatVND(d.remaining)}đ
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleCreditorConfirm(d)}
                        >
                          Đã nhận tiền
                        </Button>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {iOwe.length === 0 && owedToMe.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Không có khoản nợ nào
              </p>
            )}
          </>
        )}
      </main>

      {/* VietQR Dialog */}
      <Dialog open={!!qrDebt} onOpenChange={() => setQrDebt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              Chuyển {formatVND(qrDebt?.remaining ?? 0)}đ cho{" "}
              {qrDebt?.creditor?.display_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qrUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="VietQR"
                  className="h-64 w-64 rounded-lg"
                />
                {/* Deep link button to open banking app */}
                {bankDeepLink && (
                  <a
                    href={bankDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      🏦 Mở app {qrDebt?.creditor?.bank_name}
                    </Button>
                  </a>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  {bankDeepLink
                    ? "Bấm nút trên hoặc scan QR bằng app ngân hàng"
                    : "Scan QR bằng app ngân hàng để chuyển khoản"}
                </p>
                <div className="text-center text-xs">
                  <p>
                    <span className="text-muted-foreground">NH:</span>{" "}
                    {qrDebt?.creditor?.bank_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">STK:</span>{" "}
                    {qrDebt?.creditor?.bank_account_no}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Tên:</span>{" "}
                    {qrDebt?.creditor?.bank_account_name}
                  </p>
                </div>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {qrDebt?.creditor?.display_name} chưa cập nhật thông tin ngân
                hàng. Liên hệ trực tiếp để chuyển khoản.
              </p>
            )}
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (qrDebt) handleConfirmPaid(qrDebt);
                setQrDebt(null);
              }}
            >
              Đã chuyển tiền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
