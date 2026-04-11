"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  last_bill_title?: string;
}

export default function HomePage() {
  const { member, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
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

    setGroups(
      (groupData ?? []).map((g) => ({
        ...g,
        member_count: countMap[g.id] ?? 0,
      }))
    );
    setLoading(false);
  }

  async function handleCreate() {
    if (!newName.trim() || !member) return;
    setSubmitting(true);

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: newName.trim(), created_by: member.id })
      .select()
      .single();

    if (error || !group) {
      toast.error("Lỗi tạo nhóm");
      setSubmitting(false);
      return;
    }

    await supabase.from("group_members").insert({
      group_id: group.id,
      member_id: member.id,
      role: "admin",
    });

    toast.success("Đã tạo nhóm!");
    setShowCreate(false);
    setNewName("");
    setSubmitting(false);
    loadGroups();
  }

  async function handleJoin() {
    if (!joinCode.trim() || !member) return;
    setSubmitting(true);

    const { data: group } = await supabase
      .from("groups")
      .select("id, name")
      .eq("invite_code", joinCode.trim().toLowerCase())
      .single();

    if (!group) {
      toast.error("Mã mời không hợp lệ");
      setSubmitting(false);
      return;
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("member_id", member.id)
      .maybeSingle();

    if (existing) {
      toast.info("Bạn đã trong nhóm này rồi");
      setSubmitting(false);
      setShowJoin(false);
      return;
    }

    await supabase.from("group_members").insert({
      group_id: group.id,
      member_id: member.id,
      role: "member",
    });

    toast.success(`Đã tham gia "${group.name}"!`);
    setShowJoin(false);
    setJoinCode("");
    setSubmitting(false);
    loadGroups();
  }

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Header like chat app */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <h1 className="text-lg font-bold">Group Fund</h1>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setShowJoin(true)}
            >
              Tham gia
            </Button>
            <Button
              size="sm"
              className="h-8 bg-orange-600 text-xs hover:bg-orange-700"
              onClick={() => setShowCreate(true)}
            >
              + Tạo nhóm
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="text-5xl">👥</span>
            <div>
              <p className="font-medium">Chưa có nhóm nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tạo nhóm mới hoặc tham gia bằng mã mời
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowCreate(true)}
              >
                Tạo nhóm
              </Button>
              <Button variant="outline" onClick={() => setShowJoin(true)}>
                Nhập mã mời
              </Button>
            </div>
          </div>
        ) : (
          /* Groups list - chat app style */
          <div className="space-y-1">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => router.push(`/groups/${g.id}`)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.member_count} thành viên
                  </p>
                </div>
              </button>
            ))}
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
              className="w-full bg-orange-600 hover:bg-orange-700"
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
              className="w-full bg-orange-600 hover:bg-orange-700"
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
