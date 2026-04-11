"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatVND } from "@/lib/format-vnd";
import type { Bill, BillParticipant, Member } from "@/lib/types";

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [bill, setBill] = useState<Bill | null>(null);
  const [participants, setParticipants] = useState<
    (BillParticipant & { member?: Member })[]
  >([]);
  const [payer, setPayer] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load members
      const { data: memberData } = await supabase.from("members").select("*");
      const memberMap: Record<string, Member> = {};
      memberData?.forEach((m) => (memberMap[m.id] = m));

      // Load bill
      const { data: billData } = await supabase
        .from("bills")
        .select("*")
        .eq("id", id)
        .single();

      if (!billData) {
        setLoading(false);
        return;
      }

      setBill(billData);
      setPayer(memberMap[billData.paid_by] ?? null);

      // Load participants
      const { data: partData } = await supabase
        .from("bill_participants")
        .select("*")
        .eq("bill_id", id)
        .order("amount", { ascending: false });

      setParticipants(
        (partData ?? []).map((p) => ({ ...p, member: memberMap[p.member_id] }))
      );
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Chi tiết" />
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
        </div>
      </>
    );
  }

  if (!bill) {
    return (
      <>
        <MobileHeader title="Chi tiết" />
        <p className="py-8 text-center text-muted-foreground">
          Không tìm thấy hóa đơn
        </p>
      </>
    );
  }

  return (
    <>
      <MobileHeader title={bill.title} />
      <main className="space-y-4 p-4">
        {/* Summary */}
        <Card>
          <CardContent className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tổng tiền</span>
              <span className="text-xl font-bold">
                {formatVND(bill.total_amount)}đ
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Người trả</span>
              <span className="font-medium">
                {payer?.display_name ?? "?"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chia</span>
              <Badge variant="outline">
                {bill.split_type === "equal" ? "Chia đều" : "Tùy chỉnh"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ngày</span>
              <span className="text-sm">
                {new Date(bill.created_at).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Người tham gia ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {participants.map((p) => {
                const isPayer = p.member_id === bill.paid_by;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {p.member?.display_name ?? "?"}
                        </span>
                        {isPayer && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            Trả bill
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {formatVND(p.amount)}đ
                      </span>
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
