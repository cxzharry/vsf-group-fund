"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import type { Group } from "@/lib/types";

interface GroupDebtInfo {
  netDebt: number;           // negative = I owe, positive = owed to me (kept for sign only)
  topPersonName: string;     // name of person with largest debt relationship
  topPersonAmount: number;   // GROSS amount to/from top person (NOT net) — matches group banner
  debtorCount: number;       // how many people owe me in this group
  creditorCount: number;     // how many people I owe in this group
  /** Single debt id if user has exactly one pending debt to top creditor — shortcut for "Trả nợ" → transfer screen */
  debtId?: string;
  /** Top creditor id (for aggregated per-creditor transfer page) — only set when user is net debtor */
  topCreditorId?: string;
  /** # debts from me to top creditor in this group (≥2 → use aggregated transfer page) */
  topCreditorDebtCount: number;
}

interface GroupItem extends Group {
  member_count: number;
  debt: GroupDebtInfo;
}

/** Build subtitle text for a group card based on debt info.
 * Shows GROSS amount to/from top person (not net) so this matches the group-detail banner exactly.
 * Rationale: avoids "outside says 719k, inside says 900k" mismatch when user is both owed and owing.
 */
function buildDebtSubtitle(debt: GroupDebtInfo, memberCount: number): { text: string; color: string } {
  const { netDebt, topPersonName, topPersonAmount, debtorCount, creditorCount } = debt;

  if (netDebt === 0) {
    return { text: `${memberCount} thành viên`, color: "text-[#8E8E93]" };
  }

  const amountStr = topPersonAmount.toLocaleString("vi-VN");

  if (netDebt < 0) {
    const text = creditorCount === 1
      ? `Bạn nợ ${topPersonName} ${amountStr}đ`
      : `Bạn nợ ${topPersonName} ${amountStr}đ và ${creditorCount - 1} người khác`;
    return { text, color: "text-[#FF3B30]" };
  }

  const text = debtorCount === 1
    ? `${topPersonName} nợ bạn ${amountStr}đ`
    : `${topPersonName} nợ bạn ${amountStr}đ và ${debtorCount - 1} người khác`;
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
      // Pair-net per counterparty (simplified view everywhere):
      //   pairNet[X] = sum(X owes me) - sum(I owe X)
      //   positive → X net-owes me | negative → I net-owe X | ~0 → settled.
      const pairNet: Record<string, number> = {};
      const myDebtsInGroup: Array<{ id: string; creditor_id: string }> = [];

      (myDebts ?? [])
        .filter((d: Record<string, unknown>) => getGroupId(d) === gId)
        .forEach((d: Record<string, unknown>) => {
          const cId = d.creditor_id as string;
          pairNet[cId] = (pairNet[cId] ?? 0) - (d.remaining as number);
          myDebtsInGroup.push({ id: d.id as string, creditor_id: cId });
        });
      (owedToMe ?? [])
        .filter((d: Record<string, unknown>) => getGroupId(d) === gId)
        .forEach((d: Record<string, unknown>) => {
          const dId = d.debtor_id as string;
          pairNet[dId] = (pairNet[dId] ?? 0) + (d.remaining as number);
        });

      const creditorPairs = Object.entries(pairNet).filter(([, n]) => n < -1);  // I net-owe
      const debtorPairs = Object.entries(pairNet).filter(([, n]) => n > 1);     // they net-owe me
      const net = Object.values(pairNet).reduce((s, n) => s + n, 0);

      let topPersonName = "";
      let topPersonAmount = 0;
      let topCreditorId: string | undefined;
      let topCreditorDebtCount = 0;
      let debtId: string | undefined;

      if (net < 0 && creditorPairs.length > 0) {
        const top = creditorPairs.sort((a, b) => a[1] - b[1])[0]; // most negative
        topCreditorId = top[0];
        topPersonName = nameMap[top[0]] ?? "Ẩn danh";
        topPersonAmount = -top[1];
        // Count underlying debts in BOTH directions with this person (aggregated page closes all).
        const myToThem = myDebtsInGroup.filter((d) => d.creditor_id === topCreditorId).length;
        const theirToMe = (owedToMe ?? []).filter((d: Record<string, unknown>) =>
          getGroupId(d) === gId && (d.debtor_id as string) === topCreditorId
        ).length;
        topCreditorDebtCount = myToThem + theirToMe;
        // Single-debt shortcut only when no offsetting + exactly 1 debt to them.
        if (myToThem === 1 && theirToMe === 0) {
          debtId = myDebtsInGroup.find((d) => d.creditor_id === topCreditorId)?.id;
        }
      } else if (net > 0 && debtorPairs.length > 0) {
        const top = debtorPairs.sort((a, b) => b[1] - a[1])[0];
        topPersonName = nameMap[top[0]] ?? "Ẩn danh";
        topPersonAmount = top[1];
      }

      debtPerGroup[gId] = {
        netDebt: net,
        topPersonName,
        topPersonAmount,
        creditorCount: creditorPairs.length,
        debtorCount: debtorPairs.length,
        debtId,
        topCreditorId,
        topCreditorDebtCount,
      };
    }

    const items: GroupItem[] = (groupData ?? []).map((g) => ({
      ...g,
      member_count: countMap[g.id] ?? 0,
      debt: debtPerGroup[g.id] ?? { netDebt: 0, topPersonName: "", topPersonAmount: 0, debtorCount: 0, creditorCount: 0, debtId: undefined, topCreditorId: undefined, topCreditorDebtCount: 0 },
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
                // Sum top-person amounts to stay consistent with per-group right column + subtitle.
                // Prevents "chip says 719, row says 900" mismatch when user has receivables offsetting debts.
                const totalOwe = groups.filter(g => g.debt.netDebt < 0).reduce((s, g) => s + g.debt.topPersonAmount, 0);
                const totalOwed = groups.filter(g => g.debt.netDebt > 0).reduce((s, g) => s + g.debt.topPersonAmount, 0);
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
              className="mt-1 rounded-[14px] border-[1.5px] border-[#3A5CCC] px-7 py-3 text-[15px] font-semibold text-[#3A5CCC]"
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
                <div
                  key={g.id}
                  className="flex h-[88px] w-full items-center gap-3 rounded-[14px] bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all"
                >
                  {/* Avatar + name area navigates to group detail */}
                  <Link
                    href={`/groups/${g.id}`}
                    className="flex flex-1 items-center gap-3 min-w-0 active:opacity-70"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#1C1C1E] truncate">{g.name}</p>
                      <p className={`mt-1 text-[13px] truncate ${subtitle.color}`}>
                        {subtitle.text}
                      </p>
                    </div>
                  </Link>

                  {/* Right — debt amount + action button (standalone, not inside Link) */}
                  {g.debt.netDebt !== 0 ? (
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {/* Show GROSS top-person amount (matches subtitle + group banner). Avoid net which confuses "719 outside vs 900 inside". */}
                      <span className={`text-[15px] font-semibold ${g.debt.netDebt < 0 ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                        {g.debt.netDebt < 0 ? "-" : "+"}{g.debt.topPersonAmount.toLocaleString("vi-VN")}đ
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (g.debt.netDebt < 0 && g.debt.debtId) {
                            // Single debt to top creditor — go straight to transfer screen
                            router.push(`/transfer/${g.debt.debtId}`);
                          } else if (g.debt.netDebt < 0 && g.debt.topCreditorId && g.debt.topCreditorDebtCount > 1) {
                            // Multiple debts to same creditor — aggregated transfer (single QR w/ correct total)
                            router.push(`/transfer/creditor/${g.debt.topCreditorId}?group=${g.id}`);
                          } else {
                            // Nhắc nợ or fallback — open group detail
                            router.push(`/groups/${g.id}`);
                          }
                        }}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity active:opacity-70 ${
                          g.debt.netDebt < 0
                            ? "bg-[#EEF2FF] text-[#3A5CCC]"
                            : "bg-[#F0FFF4] text-[#34C759]"
                        }`}
                      >
                        {g.debt.netDebt < 0 ? "Trả nợ" : "Nhắc nợ"}
                      </button>
                    </div>
                  ) : (
                    <span className="shrink-0 text-xs text-[#AEAEB2]">Không có nợ</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
