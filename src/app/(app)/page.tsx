"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import type { Group } from "@/lib/types";

interface GroupDebtInfo {
  netDebt: number;       // negative = I owe, positive = owed to me
  topPersonName: string; // name of person with largest debt relationship
  debtorCount: number;   // how many people owe me in this group
  creditorCount: number; // how many people I owe in this group
}

interface GroupItem extends Group {
  member_count: number;
  debt: GroupDebtInfo;
}

/** Build subtitle text for a group card based on debt info */
function buildDebtSubtitle(debt: GroupDebtInfo, memberCount: number): { text: string; color: string } {
  const { netDebt, topPersonName, debtorCount, creditorCount } = debt;

  if (netDebt === 0) {
    return { text: `${memberCount} thành viên`, color: "text-[#8E8E93]" };
  }

  if (netDebt < 0) {
    // I owe others
    const owingAmount = Math.abs(netDebt);
    const text = creditorCount === 1
      ? `Bạn nợ ${topPersonName} ${owingAmount.toLocaleString("vi-VN")}đ`
      : `Bạn nợ ${topPersonName} và ${creditorCount - 1} người khác`;
    return { text, color: "text-[#FF3B30]" };
  }

  // Others owe me
  const text = debtorCount === 1
    ? `${topPersonName} nợ bạn ${netDebt.toLocaleString("vi-VN")}đ`
    : `${topPersonName} và ${debtorCount - 1} người khác nợ bạn`;
  return { text, color: "text-[#34C759]" };
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

  const [groups, setGroups] = useState<GroupItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem("home_groups_v2");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("home_groups_v2");
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

    const [
      { data: groupData },
      { data: allGm },
      { data: myDebts },
      { data: owedToMe },
    ] = await Promise.all([
      supabase.from("groups").select("*").in("id", groupIds).order("created_at", { ascending: false }),
      supabase.from("group_members").select("group_id").in("group_id", groupIds),
      supabase.from("debts")
        .select("remaining, creditor_id, bill_id, bills!inner(group_id)")
        .eq("debtor_id", member.id).in("status", ["pending", "partial"]),
      supabase.from("debts")
        .select("remaining, debtor_id, bill_id, bills!inner(group_id)")
        .eq("creditor_id", member.id).in("status", ["pending", "partial"]),
    ]);

    // Count members per group
    const countMap: Record<string, number> = {};
    allGm?.forEach((g) => { countMap[g.group_id] = (countMap[g.group_id] ?? 0) + 1; });

    // Collect unique member IDs we need names for
    const memberIdsToFetch = new Set<string>();
    myDebts?.forEach((d) => memberIdsToFetch.add(d.creditor_id));
    owedToMe?.forEach((d) => memberIdsToFetch.add(d.debtor_id));

    // Fetch member names in one query
    const nameMap: Record<string, string> = {};
    if (memberIdsToFetch.size > 0) {
      const { data: members } = await supabase
        .from("members")
        .select("id, display_name")
        .in("id", Array.from(memberIdsToFetch));
      members?.forEach((m) => { nameMap[m.id] = m.display_name || "Ẩn danh"; });
    }

    // Calculate debt info per group
    const debtPerGroup: Record<string, GroupDebtInfo> = {};
    const getGroupId = (d: Record<string, unknown>) =>
      (d.bills as Record<string, unknown>)?.group_id as string | undefined;

    for (const gId of groupIds) {
      // Debts I owe, grouped by creditor
      const creditorTotals: Record<string, number> = {};
      (myDebts ?? [])
        .filter((d: Record<string, unknown>) => getGroupId(d) === gId)
        .forEach((d: Record<string, unknown>) => {
          const cId = d.creditor_id as string;
          creditorTotals[cId] = (creditorTotals[cId] ?? 0) + (d.remaining as number);
        });

      // Debts owed to me, grouped by debtor
      const debtorTotals: Record<string, number> = {};
      (owedToMe ?? [])
        .filter((d: Record<string, unknown>) => getGroupId(d) === gId)
        .forEach((d: Record<string, unknown>) => {
          const dId = d.debtor_id as string;
          debtorTotals[dId] = (debtorTotals[dId] ?? 0) + (d.remaining as number);
        });

      const totalOwing = Object.values(creditorTotals).reduce((s, v) => s + v, 0);
      const totalOwed = Object.values(debtorTotals).reduce((s, v) => s + v, 0);
      const net = totalOwed - totalOwing;

      // Find top person (largest individual amount) based on net direction
      let topPersonName = "";
      if (net < 0) {
        // I owe more → show largest creditor
        const topCreditor = Object.entries(creditorTotals).sort((a, b) => b[1] - a[1])[0];
        topPersonName = topCreditor ? (nameMap[topCreditor[0]] ?? "Ẩn danh") : "";
      } else if (net > 0) {
        // Others owe me more → show largest debtor
        const topDebtor = Object.entries(debtorTotals).sort((a, b) => b[1] - a[1])[0];
        topPersonName = topDebtor ? (nameMap[topDebtor[0]] ?? "Ẩn danh") : "";
      }

      debtPerGroup[gId] = {
        netDebt: net,
        topPersonName,
        creditorCount: Object.keys(creditorTotals).length,
        debtorCount: Object.keys(debtorTotals).length,
      };
    }

    const items: GroupItem[] = (groupData ?? []).map((g) => ({
      ...g,
      member_count: countMap[g.id] ?? 0,
      debt: debtPerGroup[g.id] ?? { netDebt: 0, topPersonName: "", debtorCount: 0, creditorCount: 0 },
    }));
    setGroups(items);
    setLoading(false);
    try { sessionStorage.setItem("home_groups_v2", JSON.stringify(items)); } catch {}
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
      {/* Header — US-E2-1 */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7] px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-[#1C1C1E]">Nhóm</h1>
          <button
            onClick={() => router.push("/groups/create")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A5CCC] text-white shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>

        {/* Chip tổng nợ */}
        {groups.length > 0 && (
          <div className="mt-2">
            <div className="flex h-[52px] items-center gap-1.5 rounded-[12px] bg-white px-4 text-xs">
              {(() => {
                const totalOwe = groups.filter(g => g.debt.netDebt < 0).reduce((s, g) => s + Math.abs(g.debt.netDebt), 0);
                const totalOwed = groups.filter(g => g.debt.netDebt > 0).reduce((s, g) => s + g.debt.netDebt, 0);
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
          /* Empty state */
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
          /* Group cards */
          <div className="space-y-3">
            {groups.map((g) => {
              const colors = ["#3A5CCC", "#FF9500", "#34C759", "#AF52DE", "#FF3B30", "#5AC8FA"];
              const color = colors[g.name.charCodeAt(0) % colors.length];
              const initials = g.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const subtitle = buildDebtSubtitle(g.debt, g.member_count);
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="flex h-[88px] w-full items-center gap-3 rounded-[14px] bg-white px-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98]"
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
                    <p className={`mt-1 text-[13px] truncate ${subtitle.color}`}>
                      {subtitle.text}
                    </p>
                  </div>

                  {/* Right — debt amount + action button */}
                  {g.debt.netDebt !== 0 ? (
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`text-[15px] font-semibold ${g.debt.netDebt < 0 ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                        {g.debt.netDebt < 0 ? "-" : "+"}{Math.abs(g.debt.netDebt).toLocaleString("vi-VN")}đ
                      </span>
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                        g.debt.netDebt < 0
                          ? "bg-[#EEF1FB] text-[#3A5CCC]"
                          : "bg-[#F0FFF4] text-[#34C759]"
                      }`}>
                        {g.debt.netDebt < 0 ? "Trả nợ" : "Nhắc nợ"}
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
