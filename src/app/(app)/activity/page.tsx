"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/format-vnd";
import type { Member } from "@/lib/types";

interface ActivityItem {
  id: string;
  type: "bill" | "payment" | "bill_card" | "transfer_card";
  title: string;
  description: string;
  amount: number;
  created_at: string;
}

export default function ActivityPage() {
  const { member } = useAuth();
  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member) return;
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  async function loadActivities() {
    if (!member) { setLoading(false); return; }

    // Load members for name lookup
    const { data: memberData } = await supabase.from("members").select("*");
    const memberMap: Record<string, Member> = {};
    memberData?.forEach((m) => (memberMap[m.id] = m));

    const items: ActivityItem[] = [];

    // Get bills from groups user is in
    const { data: gm } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("member_id", member.id);

    const groupIds = gm?.map((g) => g.group_id) ?? [];

    // Load all bills (from user's groups + bills without group)
    let billQuery = supabase
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (groupIds.length > 0) {
      billQuery = billQuery.or(`group_id.in.(${groupIds.join(",")}),group_id.is.null`);
    }

    const { data: bills } = await billQuery;

    bills?.forEach((b) => {
      const payer = memberMap[b.paid_by];
      items.push({
        id: `bill-${b.id}`,
        type: "bill",
        title: b.title,
        description: `${payer?.display_name ?? "?"} trả`,
        amount: b.total_amount,
        created_at: b.created_at,
      });
    });

    // Load payment confirmations
    const { data: confirmations } = await supabase
      .from("payment_confirmations")
      .select("*, debts:debt_id(debtor_id, creditor_id, amount)")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(50);

    confirmations?.forEach((c) => {
      const debt = c.debts as { debtor_id: string; creditor_id: string; amount: number } | null;
      if (!debt) return;
      const debtor = memberMap[debt.debtor_id];
      const creditor = memberMap[debt.creditor_id];
      items.push({
        id: `pay-${c.id}`,
        type: "payment",
        title: `${debtor?.display_name ?? "?"} → ${creditor?.display_name ?? "?"}`,
        description: c.method === "screenshot_ocr" ? "Xác nhận bằng ảnh" : "Xác nhận thủ công",
        amount: debt.amount,
        created_at: c.created_at,
      });
    });

    // Load bill_card and transfer_card messages from user's groups
    if (groupIds.length > 0) {
      const { data: chatMsgs } = await supabase
        .from("chat_messages")
        .select("*")
        .in("group_id", groupIds)
        .in("message_type", ["bill_card", "transfer_card"])
        .order("created_at", { ascending: false })
        .limit(50);

      chatMsgs?.forEach((m) => {
        const meta = (m.metadata ?? {}) as Record<string, unknown>;
        if (m.message_type === "bill_card") {
          items.push({
            id: `msg-${m.id}`,
            type: "bill_card",
            title: m.content || "Bill mới",
            description: "Đã tạo bill trong nhóm",
            amount: (meta.amount as number) ?? 0,
            created_at: m.created_at,
          });
        } else if (m.message_type === "transfer_card") {
          const fromId = meta.from_member_id as string | undefined;
          const toId = meta.to_member_id as string | undefined;
          const fromName = fromId ? (memberMap[fromId]?.display_name ?? "?") : "?";
          const toName = toId ? (memberMap[toId]?.display_name ?? "?") : "?";
          items.push({
            id: `msg-${m.id}`,
            type: "transfer_card",
            title: `${fromName} → ${toName}`,
            description: "Chuyển khoản",
            amount: (meta.amount as number) ?? 0,
            created_at: m.created_at,
          });
        }
      });
    }

    // Sort by date desc
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setActivities(items);
    setLoading(false);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ trước`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }

  return (
    <>
      <MobileHeader title="Hoạt động" />
      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-muted-foreground">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((a) => (
              <Card key={a.id} className="border-0 shadow-none">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                    {a.type === "bill" || a.type === "bill_card" ? "🧾" : "💸"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {formatVND(a.amount)}đ
                    </Badge>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatTime(a.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
