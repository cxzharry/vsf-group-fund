"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Group } from "@/lib/types";

interface GroupItem extends Group {
  member_count: number;
  netDebt: number; // negative = I owe, positive = owed to me
  debtLabel: string;
}

export default function HomePage() {
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
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      else if (owed > 0) label = `Bạn được nợ ${owed.toLocaleString("vi-VN")}đ`;
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

  async function handleCreate() {
    if (!newName.trim() || !member) return;
    setSubmitting(true);

    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), memberId: member.id }),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error ?? "Lỗi tạo nhóm");
      setSubmitting(false);
      return;
    }

    toast.success("Đã tạo nhóm!");
    setShowCreate(false);
    setNewName("");
    setSubmitting(false);
    try { sessionStorage.removeItem("home_groups"); } catch {}
    loadGroups();
  }

  async function handleJoin() {
    if (!joinCode.trim() || !member) return;
    setSubmitting(true);

    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode.trim(), memberId: member.id }),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error ?? "Không thể tham gia nhóm");
      setSubmitting(false);
      return;
    }

    toast.success(`Đã tham gia "${result.group?.name}"!`);
    setShowJoin(false);
    setJoinCode("");
    setSubmitting(false);
    try { sessionStorage.removeItem("home_groups"); } catch {}
    loadGroups();
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
      {/* Header — matches Pencil design */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7] px-5 pt-3 pb-2">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <h1 className="text-[28px] font-bold text-[#1C1C1E]">Nhóm</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="text-sm font-medium text-[#3A5CCC]"
            >
              Tham gia
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3A5CCC] text-white shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        </div>
        {/* Total debt summary */}
        {groups.length > 0 && (
          <div className="mx-auto mt-2 max-w-md">
            <div className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs">
              {(() => {
                const totalOwe = groups.filter(g => g.netDebt < 0).reduce((s, g) => s + Math.abs(g.netDebt), 0);
                const totalOwed = groups.filter(g => g.netDebt > 0).reduce((s, g) => s + g.netDebt, 0);
                return (
                  <>
                    {totalOwe > 0 && (
                      <span>Tổng: <span className="font-semibold text-[#FF3B30]">Bạn đang nợ {totalOwe.toLocaleString("vi-VN")}đ</span></span>
                    )}
                    {totalOwe > 0 && totalOwed > 0 && <span className="text-[#C7C7CC]">·</span>}
                    {totalOwed > 0 && (
                      <span>Bạn được nợ <span className="font-semibold text-[#34C759]">{totalOwed.toLocaleString("vi-VN")}đ</span></span>
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

      <main className="px-5 py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="font-semibold text-[#1C1C1E]">Chưa có nhóm nào</p>
            <p className="text-sm text-[#8E8E93]">Tạo nhóm để bắt đầu chia bill với bạn bè</p>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-xl border border-[#3A5CCC] px-5 py-2.5 text-sm font-semibold text-[#3A5CCC]"
              >
                Tạo nhóm mới
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className="rounded-xl border border-[#E5E5EA] px-5 py-2.5 text-sm font-semibold text-[#1C1C1E]"
              >
                Nhập mã mời
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const colors = ["#3A5CCC", "#FF9500", "#34C759", "#AF52DE", "#FF3B30", "#5AC8FA"];
              const color = colors[g.name.charCodeAt(0) % colors.length];
              const initials = g.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98]"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1C1C1E] truncate">{g.name}</p>
                    <p className="text-xs text-[#8E8E93]">{g.debtLabel || `${g.member_count} thành viên`}</p>
                  </div>
                  {g.netDebt !== 0 && (
                    <span className={`text-sm font-bold ${g.netDebt < 0 ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                      {g.netDebt < 0 ? "-" : "+"}{Math.abs(g.netDebt).toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tạo nhóm mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên nhóm</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Team Product"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <Button
              className="w-full bg-[#3A5CCC] hover:bg-[#2f4fb0]"
              onClick={handleCreate}
              disabled={submitting || !newName.trim()}
            >
              {submitting ? "Đang tạo..." : "Tạo nhóm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tham gia nhóm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mã mời</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Nhập mã 8 ký tự"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <Button
              className="w-full bg-[#3A5CCC] hover:bg-[#2f4fb0]"
              onClick={handleJoin}
              disabled={submitting || !joinCode.trim()}
            >
              {submitting ? "Đang tham gia..." : "Tham gia"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
