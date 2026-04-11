"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Group, Member } from "@/lib/types";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { member: currentMember } = useAuth();
  const supabase = createClient();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(Member & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .single();
    setGroup(groupData);

    const { data: gm } = await supabase
      .from("group_members")
      .select("member_id, role")
      .eq("group_id", id);

    if (gm?.length) {
      const memberIds = gm.map((m) => m.member_id);
      const roleMap = new Map(gm.map((m) => [m.member_id, m.role]));

      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .in("id", memberIds)
        .order("display_name");

      setMembers(
        (memberData ?? []).map((m) => ({
          ...m,
          role: roleMap.get(m.id) ?? "member",
        }))
      );
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  function copyInviteCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    toast.success(`Mã mời: ${group.invite_code} — đã copy!`);
  }

  if (loading) {
    return (
      <>
        <MobileHeader title="Nhóm" />
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
        </div>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <MobileHeader title="Nhóm" />
        <p className="py-8 text-center text-muted-foreground">Không tìm thấy nhóm</p>
      </>
    );
  }

  return (
    <>
      <MobileHeader title={group.name} />
      <main className="space-y-4 p-4">
        {/* Invite code */}
        <Card>
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="text-xs text-muted-foreground">Mã mời</p>
              <p className="font-mono text-lg font-bold tracking-wider">
                {group.invite_code}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={copyInviteCode}>
              Copy
            </Button>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => router.push(`/bills/new?group=${id}`)}
          >
            + Tạo bill
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/bills?group=${id}`)}
          >
            Xem bills
          </Button>
        </div>

        {/* Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Thành viên ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {members.map((m) => {
              const initials = m.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border p-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.display_name}
                      {m.id === currentMember?.id && (
                        <span className="text-muted-foreground"> (bạn)</span>
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={m.role === "admin" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {m.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
