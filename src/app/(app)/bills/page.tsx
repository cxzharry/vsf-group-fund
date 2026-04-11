"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/format-vnd";
import type { Bill, Member } from "@/lib/types";

interface BillWithPayer extends Bill {
  payer?: Member;
  participant_count?: number;
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillWithPayer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      // Load members for name lookup
      const { data: memberData } = await supabase
        .from("members")
        .select("*");
      const memberMap: Record<string, Member> = {};
      memberData?.forEach((m) => (memberMap[m.id] = m));

      // Load bills with participant count
      const { data: billData } = await supabase
        .from("bills")
        .select("*, bill_participants(count)")
        .order("created_at", { ascending: false });

      const enriched: BillWithPayer[] = (billData ?? []).map((b) => ({
        ...b,
        payer: memberMap[b.paid_by],
        participant_count: b.bill_participants?.[0]?.count ?? 0,
      }));

      setBills(enriched);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <MobileHeader title="Hóa đơn" />
      <main className="p-4">
        <Link href="/bills/new">
          <Button className="mb-4 w-full bg-orange-600 hover:bg-orange-700">
            + Tạo hóa đơn mới
          </Button>
        </Link>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : bills.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Chưa có hóa đơn nào
          </p>
        ) : (
          <div className="space-y-2">
            {bills.map((bill) => (
              <Link key={bill.id} href={`/bills/${bill.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{bill.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.payer?.display_name ?? "?"} trả &middot;{" "}
                        {bill.participant_count} người &middot;{" "}
                        {formatDate(bill.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="ml-2 shrink-0 text-sm font-semibold"
                    >
                      {formatVND(bill.total_amount)}đ
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
