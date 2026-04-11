"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Group } from "@/lib/types";

export default function GroupsPage() {
  const { member } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [groups, setGroups] = useState<(Group & { member_count: number; role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!member) return;

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("member_id", member.id);

    if (!memberships?.length) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);
    const roleMap = new Map(memberships.map((m) => [m.group_id, m.role]));

    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    // Get member counts
    const { data: counts } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    const countMap: Record<string, number> = {};
    counts?.forEach((c) => {
      countMap[c.group_id] = (countMap[c.group_id] ?? 0) + 1;
    });

    setGroups(
      (groupData ?? []).map((g) => ({
        ...g,
        member_count: countMap[g.id] ?? 0,
        role: roleMap.get(g.id) ?? "member",
      }))
    );
    setLoading(false);
  }, [member, supabase]);

  useEffect(() => {
    if (!member) return;
    const timer = setTimeout(() => loadGroups(), 0);
    return () => clearTimeout(timer);
  }, [member, loadGroups]);

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

    // Add creator as admin
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

    // Check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("member_id", member.id)
      .single();

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

    toast.success(`Đã tham gia nhóm "${group.name}"!`);
    setShowJoin(false);
    setJoinCode("");
    setSubmitting(false);
    loadGroups();
  }

  return (
    <>
      <MobileHeader title="Nhóm" />
      <main className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            onClick={() => setShowCreate(true)}
          >
            + Tạo nhóm
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowJoin(true)}
          >
            Tham gia
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Bạn chưa tham gia nhóm nào
          </p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <Card
                key={g.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/groups/${g.id}`)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.member_count} thành viên
                    </p>
                  </div>
                  <Badge variant={g.role === "admin" ? "default" : "secondary"} className="text-xs">
                    {g.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create group dialog */}
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

      {/* Join group dialog */}
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
                placeholder="Nhập mã mời từ admin nhóm"
                autoFocus
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
