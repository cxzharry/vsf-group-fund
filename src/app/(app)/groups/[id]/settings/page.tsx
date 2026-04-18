"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { DebtBalancesView } from "@/components/group/debt-balances-view";
import type { RawDebt } from "@/lib/simplify-debts";
import type { Group, GroupMember, Member } from "@/lib/types";

interface MemberWithRole extends Member {
  role: "admin" | "member";
}

export default function GroupSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { member: currentMember } = useAuth();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [group, setGroup] = useState<Group | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(`group_settings_${id}`);
      return cached ? JSON.parse(cached).group : null;
    } catch { return null; }
  });
  const [members, setMembers] = useState<MemberWithRole[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem(`group_settings_${id}`);
      return cached ? JSON.parse(cached).members : [];
    } catch { return []; }
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(`group_settings_${id}`);
  });
  const [groupDebts, setGroupDebts] = useState<RawDebt[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .single();

    if (!groupData) {
      setLoading(false);
      return;
    }
    setGroup(groupData);
    setNameInput(groupData.name);

    const { data: gmData } = await supabase
      .from("group_members")
      .select("member_id, role")
      .eq("group_id", id);

    const memberIds = (gmData ?? []).map((gm: Pick<GroupMember, "member_id" | "role">) => gm.member_id);
    const roleMap = new Map(
      (gmData ?? []).map((gm: Pick<GroupMember, "member_id" | "role">) => [gm.member_id, gm.role])
    );

    if (currentMember) {
      setIsAdmin(roleMap.get(currentMember.id) === "admin");
    }

    let enrichedMembers: MemberWithRole[] = [];
    if (memberIds.length > 0) {
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .in("id", memberIds);

      enrichedMembers = (memberData ?? []).map((m: Member) => ({
        ...m,
        role: roleMap.get(m.id) ?? "member",
      }));
      setMembers(enrichedMembers);
    }

    // Fetch all pending/partial debts for this group to power "Ai nợ ai" view
    const { data: billsForDebts } = await supabase
      .from("bills")
      .select("id")
      .eq("group_id", id);
    const billIds = (billsForDebts ?? []).map((b: { id: string }) => b.id);
    if (billIds.length > 0) {
      const { data: debtRows } = await supabase
        .from("debts")
        .select("id, debtor_id, creditor_id, remaining")
        .in("bill_id", billIds)
        .in("status", ["pending", "partial"]);
      setGroupDebts((debtRows ?? []) as RawDebt[]);
    } else {
      setGroupDebts([]);
    }

    try { sessionStorage.setItem(`group_settings_${id}`, JSON.stringify({ group: groupData, members: enrichedMembers })); } catch {}
    setLoading(false);
  }, [id, supabase, currentMember]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleSaveName() {
    if (!nameInput.trim() || !group) return;
    setSavingName(true);
    const { error } = await supabase
      .from("groups")
      .update({ name: nameInput.trim() })
      .eq("id", id);

    if (error) {
      toast.error("Lỗi cập nhật tên nhóm");
    } else {
      try { sessionStorage.removeItem(`group_settings_${id}`); } catch {}
      setGroup((prev) => prev ? { ...prev, name: nameInput.trim() } : prev);
      setEditingName(false);
      toast.success("Đã cập nhật tên nhóm");
    }
    setSavingName(false);
  }

  async function handleCopyInviteCode() {
    if (!group?.invite_code) return;
    await navigator.clipboard.writeText(group.invite_code);
    toast.success("Đã sao chép mã mời");
  }

  async function handleLeaveGroup() {
    if (!currentMember) return;
    setLeaving(true);

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("member_id", currentMember.id);

    if (error) {
      toast.error("Lỗi rời nhóm");
      setLeaving(false);
      return;
    }

    try { sessionStorage.removeItem(`group_settings_${id}`); } catch {}
    toast.success("Đã rời nhóm");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-[#AEAEB2]">Không tìm thấy nhóm</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      {/* Nav bar */}
      <header className="flex h-[52px] shrink-0 items-center bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-3 flex h-11 w-11 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F2F2F7]"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-[#1C1C1E]">Cài đặt nhóm</h1>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {/* Group name */}
        <div className="rounded-[14px] bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-[#AEAEB2] uppercase tracking-wide">Tên nhóm</p>
          {editingName && isAdmin ? (
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 rounded-[14px] border border-[#E5E5EA] bg-[#F2F2F7] px-3 py-2 text-sm text-[#1C1C1E] outline-none focus:border-[#3A5CCC]"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingName || !nameInput.trim()}
                className="rounded-[14px] bg-[#3A5CCC] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {savingName ? "..." : "Lưu"}
              </button>
              <button
                type="button"
                onClick={() => { setEditingName(false); setNameInput(group.name); }}
                className="rounded-[14px] border border-[#E5E5EA] px-3 py-2 text-xs text-[#8E8E93]"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-[#1C1C1E]">{group.name}</p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-xs text-[#3A5CCC] font-medium"
                >
                  Sửa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Invite code */}
        <div className="rounded-[14px] bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-[#AEAEB2] uppercase tracking-wide">Mã mời</p>
          <div className="flex items-center justify-between">
            <p className="text-base font-mono font-semibold text-[#1C1C1E] tracking-widest">
              {group.invite_code}
            </p>
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="rounded-[14px] bg-[#3A5CCC] px-4 py-3 text-xs font-semibold text-white"
            >
              Sao chép
            </button>
          </div>
        </div>

        {/* Member list */}
        <div className="rounded-[14px] bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <p className="text-sm font-semibold text-[#1C1C1E]">
              Thành viên ({members.length})
            </p>
          </div>
          {members.map((m, idx) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-4 py-3 ${idx < members.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3A5CCC]/10 text-sm font-bold text-[#3A5CCC]">
                  {m.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1C1E]">
                    {m.display_name}
                    {m.id === currentMember?.id && (
                      <span className="ml-1 text-xs text-[#AEAEB2]">(Bạn)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#AEAEB2]">{m.email}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                m.role === "admin"
                  ? "bg-[#3A5CCC]/10 text-[#3A5CCC]"
                  : "bg-[#F2F2F7] text-[#8E8E93]"
              }`}>
                {m.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
          ))}
        </div>

        {/* "Ai nợ ai" — debt balances + simplified view */}
        <DebtBalancesView debts={groupDebts} members={members} />

        {/* Leave group */}
        <div className="rounded-[14px] bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full rounded-[14px] bg-[#FF3B30]/10 py-3 text-sm font-semibold text-[#FF3B30]"
          >
            Rời nhóm
          </button>
        </div>
      </div>

      {/* Leave confirm dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[320px] rounded-[14px] bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-center text-[17px] font-semibold text-[#1C1C1E]">Rời nhóm?</h3>
            <p className="mb-5 text-center text-[14px] text-[#8E8E93]">
              Bạn sẽ không còn thấy các bill và tin nhắn của nhóm &ldquo;{group.name}&rdquo;.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-[14px] border border-[#E5E5EA] py-3 text-sm font-semibold text-[#1C1C1E]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleLeaveGroup}
                disabled={leaving}
                className="flex-1 rounded-[14px] bg-[#FF3B30] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {leaving ? "Đang rời..." : "Rời nhóm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
