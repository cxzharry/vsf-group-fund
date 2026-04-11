"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatVND } from "@/lib/format-vnd";
import type { Debt, Member } from "@/lib/types";

interface DebtWithNames extends Debt {
  debtor?: Member;
  creditor?: Member;
}

export default function SummaryPage() {
  const { member } = useAuth();
  const router = useRouter();
  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );

  const [debts, setDebts] = useState<DebtWithNames[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member) return;
    loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  async function loadDebts() {
    if (!member) { setLoading(false); return; }

    const { data: memberData } = await supabase.from("members").select("*");
    const memberMap: Record<string, Member> = {};
    memberData?.forEach((m) => (memberMap[m.id] = m));

    const { data: debtData } = await supabase
      .from("debts")
      .select("*")
      .or(`debtor_id.eq.${member.id},creditor_id.eq.${member.id}`)
      .neq("status", "confirmed")
      .order("created_at", { ascending: false });

    setDebts(
      (debtData ?? []).map((d) => ({
        ...d,
        debtor: memberMap[d.debtor_id],
        creditor: memberMap[d.creditor_id],
      }))
    );
    setLoading(false);
  }

  const iOwe = debts.filter((d) => d.debtor_id === member?.id);
  const owedToMe = debts.filter((d) => d.creditor_id === member?.id);
  const totalIOwe = iOwe.reduce((s, d) => s + d.remaining, 0);
  const totalOwedToMe = owedToMe.reduce((s, d) => s + d.remaining, 0);

  // Net balances per person
  const netBalances: Record<string, { name: string; amount: number; memberId: string }> = {};
  for (const d of debts) {
    const otherId = d.debtor_id === member?.id ? d.creditor_id : d.debtor_id;
    const otherName = d.debtor_id === member?.id
      ? d.creditor?.display_name ?? "?"
      : d.debtor?.display_name ?? "?";
    const sign = d.debtor_id === member?.id ? -1 : 1;
    if (!netBalances[otherId]) netBalances[otherId] = { name: otherName, amount: 0, memberId: otherId };
    netBalances[otherId].amount += sign * d.remaining;
  }

  async function handleCreditorConfirm(debt: DebtWithNames) {
    await supabase.from("payment_confirmations").insert({
      debt_id: debt.id, confirmed_by: "creditor",
      method: "manual_creditor", status: "confirmed",
    });
    await supabase.from("debts").update({ remaining: 0, status: "confirmed" }).eq("id", debt.id);

    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payment_confirmed", payload: { debtId: debt.id } }),
    }).catch(() => {});

    loadDebts();
  }

  return (
    <>
      <MobileHeader title="Tổng kết" />
      <main className="space-y-4 p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : debts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-muted-foreground">Không có khoản nợ nào</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-red-100 bg-red-50/50">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tôi nợ</p>
                  <p className="text-xl font-bold text-red-600">{formatVND(totalIOwe)}đ</p>
                </CardContent>
              </Card>
              <Card className="border-green-100 bg-green-50/50">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Nợ tôi</p>
                  <p className="text-xl font-bold text-green-600">{formatVND(totalOwedToMe)}đ</p>
                </CardContent>
              </Card>
            </div>

            {/* Net balances */}
            {Object.keys(netBalances).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bù trừ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {Object.entries(netBalances)
                    .sort((a, b) => a[1].amount - b[1].amount)
                    .map(([id, { name, amount }]) => (
                      <div key={id} className="flex items-center justify-between py-1.5">
                        <span className="text-sm">{name}</span>
                        <span className={`text-sm font-medium ${amount < 0 ? "text-red-600" : "text-green-600"}`}>
                          {amount < 0 ? "-" : "+"}{formatVND(Math.abs(amount))}đ
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* I owe */}
            {iOwe.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">Tôi cần trả ({iOwe.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {iOwe.map((d) => (
                    <div key={d.id}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{d.creditor?.display_name}</p>
                          <p className="text-xs text-muted-foreground">{formatVND(d.remaining)}đ</p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 bg-orange-600 text-xs hover:bg-orange-700"
                          onClick={() => router.push(`/debts/${d.id}/confirm`)}
                        >
                          Trả tiền
                        </Button>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Owed to me */}
            {owedToMe.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">Chờ nhận ({owedToMe.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {owedToMe.map((d) => (
                    <div key={d.id}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{d.debtor?.display_name}</p>
                          <p className="text-xs text-muted-foreground">{formatVND(d.remaining)}đ</p>
                        </div>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => handleCreditorConfirm(d)}
                        >
                          Đã nhận
                        </Button>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}
