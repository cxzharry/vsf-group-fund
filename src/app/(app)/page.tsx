"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import type { Group } from "@/lib/types";

interface GroupItem extends Group {
  member_count: number;
  netDebt: number; // negative = I owe, positive = owed to me
  debtLabel: string;
}

export default function HomePage() {
  const router = useRouter();
  const { member, loading: authLoading } = useAuth();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Stale-while-revalidate: show cached data instantly, refresh in background
  const [groups, setGroups] = useState<GroupItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem("home_groups");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("home_groups");
  });

  useEffect(() => {
    if (!member) return;
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  async function loadGroups() {
    if (!member) { setLoading(false); return; }

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("member_id", member.id);

    if (!memberships?.length) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    // Count members per group
    const { data: allGm } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    const countMap: Record<string, number> = {};
    allGm?.forEach((g) => {
      countMap[g.group_id] = (countMap[g.group_id] ?? 0) + 1;
    });

    // Calculate net debt per group
    const { data: myDebts } = await supabase
      .from("debts")
      .select("remaining, creditor_id, bill_id, bills!inner(group_id)")
      .eq("debtor_id", member.id)
      .in("status", ["pending", "partial"]);

    const { data: owedToMe } = await supabase
      .from("debts")
      .select("remaining, debtor_id, bill_id, bills!inner(group_id)")
      .eq("creditor_id", member.id)
      .in("status", ["pending", "partial"]);

    const debtPerGroup: Record<string, { net: number; label: string }> = {};
    for (const gId of groupIds) {
      const owing = (myDebts ?? [])
        .filter((d: Record<string, unknown>) => (d.bills as Record<string, unknown>)?.group_id === gId)
        .reduce((s: number, d: { remaining: number }) => s + d.remaining, 0);
      const owed = (owedToMe ?? [])
        .filter((d: Record<string, unknown>) => (d.bills as Record<string, unknown>)?.group_id === gId)
        .reduce((s: number, d: { remaining: number }) => s + d.remaining, 0);
      const net = owed - owing;
      let label = "";
      if (owing > 0) label = `Bạn đang nợ ${owing.toLocaleString("vi-VN")}đ`;
      else if (owed > 0) label = `Được nợ ${owed.toLocaleString("vi-VN")}đ`;
      debtPerGroup[gId] = { net, label };
    }

    const items = (groupData ?? []).map((g) => ({
      ...g,
      member_count: countMap[g.id] ?? 0,
      netDebt: debtPerGroup[g.id]?.net ?? 0,
      debtLabel: debtPerGroup[g.id]?.label ?? "",
    }));
    setGroups(items);
    setLoading(false);
    try { sessionStorage.setItem("home_groups", JSON.stringify(items)); } catch {}
  }

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Header — US-2.1 Pencil design */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7] px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-[#1C1C1E]">Nhóm</h1>
          <button
            onClick={() => router.push("/groups/create")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3A5CCC] text-white shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>

        {/* Chip tổng nợ — h52, rounded-12 */}
        {groups.length > 0 && (
          <div className="mt-2">
            <div className="flex h-[52px] items-center gap-1.5 rounded-[12px] bg-white px-4 text-xs">
              {(() => {
                const totalOwe = groups.filter(g => g.netDebt < 0).reduce((s, g) => s + Math.abs(g.netDebt), 0);
                const totalOwed = groups.filter(g => g.netDebt > 0).reduce((s, g) => s + g.netDebt, 0);
                return (
                  <>
                    {totalOwe > 0 && (
                      <span className="text-[#636366]">Tổng: <span className="font-semibold text-[#FF3B30]">Bạn đang nợ {totalOwe.toLocaleString("vi-VN")}đ</span></span>
                    )}
                    {totalOwe > 0 && totalOwed > 0 && <span className="text-[#C7C7CC]">·</span>}
                    {totalOwed > 0 && (
                      <span className="text-[#636366]">Bạn được nợ <span className="font-semibold text-[#34C759]">{totalOwed.toLocaleString("vi-VN")}đ</span></span>
                    )}
                    {totalOwe === 0 && totalOwed === 0 && (
                      <span className="text-[#8E8E93]">Không có khoản nợ</span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          /* Empty state — US-2.1 */
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-[20px] font-semibold text-[#1C1C1E]">Chưa có nhóm nào</p>
            <p className="text-[15px] text-[#8E8E93]">Tạo nhóm để bắt đầu chia bill với bạn bè.</p>
            <button
              onClick={() => router.push("/groups/create")}
              className="mt-1 rounded-[10px] border-[1.5px] border-[#3A5CCC] px-7 py-3 text-[15px] font-semibold text-[#3A5CCC]"
            >
              Tạo nhóm mới
            </button>
          </div>
        ) : (
          /* Group cards — US-2.1 */
          <div className="space-y-3">
            {groups.map((g) => {
              const colors = ["#3A5CCC", "#FF9500", "#34C759", "#AF52DE", "#FF3B30", "#5AC8FA"];
              const color = colors[g.name.charCodeAt(0) % colors.length];
              const initials = g.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="flex h-[88px] w-full items-center gap-3 rounded-[14px] bg-white px-4 text-left transition-all active:scale-[0.98]"
                >
                  {/* Avatar 44px */}
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>

                  {/* Name + debt subtitle */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1C1C1E] truncate">{g.name}</p>
                    <p className={`mt-1 text-[13px] ${
                      g.netDebt < 0 ? "text-[#FF3B30]" :
                      g.netDebt > 0 ? "text-[#34C759]" :
                      "text-[#8E8E93]"
                    }`}>
                      {g.debtLabel || `${g.member_count} thành viên`}
                    </p>
                  </div>

                  {/* Right — debt amount + action button */}
                  {g.netDebt !== 0 ? (
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`text-[15px] font-semibold ${g.netDebt < 0 ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                        {g.netDebt < 0 ? "-" : "+"}{Math.abs(g.netDebt).toLocaleString("vi-VN")}đ
                      </span>
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                        g.netDebt < 0
                          ? "bg-[#EEF1FB] text-[#3A5CCC]"
                          : "bg-[#F0FFF4] text-[#34C759]"
                      }`}>
                        {g.netDebt < 0 ? "Trả nợ" : "Nhắc nợ"}
                      </span>
                    </div>
                  ) : (
                    <span className="shrink-0 text-xs text-[#AEAEB2]">Không có nợ</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
