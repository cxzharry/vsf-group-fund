"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { formatVND } from "@/lib/format-vnd";
import { toast } from "sonner";
import type {
  Group,
  Member,
  Bill,
  ChatMessage,
  BillCheckin,
} from "@/lib/types";
import type { MessageFeedItem } from "@/components/chat/chat-message-list";

// ─── component ───────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
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

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [memberCount, setMemberCount] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [billParticipantCounts, setBillParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [billCheckins, setBillCheckins] = useState<
    Record<string, BillCheckin[]>
  >({});
  // Net debt for current user in this group (positive = owed to you, negative = you owe)
  const [netDebt, setNetDebt] = useState<{
    amount: number;
    otherMemberId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");

  // ─── data loading ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    // Group info
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

    // Group members
    const { data: gm } = await supabase
      .from("group_members")
      .select("member_id")
      .eq("group_id", id);

    const memberIds = (gm ?? []).map((m: { member_id: string }) => m.member_id);
    setMemberCount(memberIds.length);

    if (memberIds.length > 0) {
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .in("id", memberIds);
      const map: Record<string, Member> = {};
      (memberData ?? []).forEach((m: Member) => (map[m.id] = m));
      setMembers(map);
    }

    // Bills for this group
    const { data: billData } = await supabase
      .from("bills")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: true });
    const fetchedBills: Bill[] = billData ?? [];
    setBills(fetchedBills);

    if (fetchedBills.length > 0) {
      const billIds = fetchedBills.map((b) => b.id);

      // Participant counts per bill
      const { data: partData } = await supabase
        .from("bill_participants")
        .select("bill_id")
        .in("bill_id", billIds);
      const counts: Record<string, number> = {};
      (partData ?? []).forEach((p: { bill_id: string }) => {
        counts[p.bill_id] = (counts[p.bill_id] ?? 0) + 1;
      });
      setBillParticipantCounts(counts);

      // Checkins per bill
      const { data: checkinData } = await supabase
        .from("bill_checkins")
        .select("*")
        .in("bill_id", billIds);
      const checkinMap: Record<string, BillCheckin[]> = {};
      (checkinData ?? []).forEach((c: BillCheckin) => {
        if (!checkinMap[c.bill_id]) checkinMap[c.bill_id] = [];
        checkinMap[c.bill_id].push(c);
      });
      setBillCheckins(checkinMap);
    }

    // Chat messages for this group
    const { data: msgData } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: true });
    setChatMessages(msgData ?? []);

    // Net debt summary for current user (inlined to avoid hoisting issues)
    if (currentMember) {
      const { data: owingData } = await supabase
        .from("debts")
        .select("remaining, creditor_id, bills!inner(group_id)")
        .eq("debtor_id", currentMember.id)
        .eq("bills.group_id", id)
        .in("status", ["pending", "partial"]);

      const { data: owedData } = await supabase
        .from("debts")
        .select("remaining, debtor_id, bills!inner(group_id)")
        .eq("creditor_id", currentMember.id)
        .eq("bills.group_id", id)
        .in("status", ["pending", "partial"]);

      const totalOwing = (owingData ?? []).reduce(
        (s: number, d: { remaining: number }) => s + d.remaining,
        0
      );
      const totalOwed = (owedData ?? []).reduce(
        (s: number, d: { remaining: number }) => s + d.remaining,
        0
      );
      const net = totalOwed - totalOwing;

      if (Math.abs(net) >= 1000) {
        let otherMemberId = "";
        if (net < 0 && owingData && owingData.length > 0) {
          const biggest = (
            owingData as Array<{ remaining: number; creditor_id: string }>
          ).sort((a, b) => b.remaining - a.remaining)[0];
          otherMemberId = biggest.creditor_id;
        } else if (net > 0 && owedData && owedData.length > 0) {
          const biggest = (
            owedData as Array<{ remaining: number; debtor_id: string }>
          ).sort((a, b) => b.remaining - a.remaining)[0];
          otherMemberId = biggest.debtor_id;
        }
        setNetDebt({ amount: net, otherMemberId });
      } else {
        setNetDebt(null);
      }
    }

    setLoading(false);
  }, [id, supabase, currentMember]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // ─── realtime subscription ───────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${id}`,
        },
        (payload) => {
          setTimeout(() => {
            setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
          }, 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  // ─── actions ─────────────────────────────────────────────────────────────

  async function handleCheckin(billId: string) {
    if (!currentMember) return toast.error("Bạn chưa đăng nhập");

    const { error } = await supabase.from("bill_checkins").insert({
      bill_id: billId,
      member_id: currentMember.id,
      added_by: currentMember.id,
    });

    if (error) {
      toast.error("Lỗi check-in");
      return;
    }

    toast.success("Đã check-in!");
    // Optimistically update checkins
    setTimeout(() => {
      setBillCheckins((prev) => {
        const existing = prev[billId] ?? [];
        const newCheckin: BillCheckin = {
          id: crypto.randomUUID(),
          bill_id: billId,
          member_id: currentMember.id,
          guest_name: null,
          added_by: currentMember.id,
          checked_in_at: new Date().toISOString(),
        };
        return { ...prev, [billId]: [...existing, newCheckin] };
      });
    }, 0);
  }

  function handleSendText() {
    if (!inputText.trim() || !currentMember) return;
    // For now just clear — future: insert chat_message of type "text"
    setInputText("");
  }

  // ─── build feed items ─────────────────────────────────────────────────────

  const feedItems = useMemo<MessageFeedItem[]>(() => {
    const items: MessageFeedItem[] = [
      ...bills.map((b) => ({
        type: "bill" as const,
        id: b.id,
        createdAt: b.created_at,
        bill: b,
      })),
      ...chatMessages.map((m) => ({
        type: "chat_message" as const,
        id: m.id,
        createdAt: m.created_at,
        message: m,
      })),
    ];
    return items.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [bills, chatMessages]);

  // ─── debt banner ────────────────────────────────────────────────────────

  const debtBanner = useMemo(() => {
    if (!netDebt || Math.abs(netDebt.amount) < 1000) return null;
    const otherMember = members[netDebt.otherMemberId];
    const otherDisplayName = otherMember?.display_name ?? "thành viên";

    if (netDebt.amount < 0) {
      // I owe
      return {
        text: `Bạn nợ ${otherDisplayName} ${formatVND(Math.abs(netDebt.amount))}đ`,
        action: "Trả nợ",
        bg: "bg-[#FFF3F0]",
        textColor: "text-red-600",
        btnColor: "bg-red-500 text-white",
      };
    }
    // Owed to me
    return {
      text: `${otherDisplayName} nợ bạn ${formatVND(netDebt.amount)}đ`,
      action: "Nhắc nợ",
      bg: "bg-[#F0FFF4]",
      textColor: "text-green-600",
      btnColor: "bg-green-500 text-white",
    };
  }, [netDebt, members]);

  // ─── render ──────────────────────────────────────────────────────────────

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
        <p className="text-sm text-gray-400">Không tìm thấy nhóm</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      {/* Nav bar */}
      <header className="flex h-[52px] shrink-0 items-center justify-between bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Quay lại"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-900">{group.name}</p>
          <p className="text-xs text-gray-400">{memberCount} thành viên</p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/groups/${id}/settings`)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Cài đặt nhóm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
      </header>

      {/* Debt banner */}
      {debtBanner && (
        <div
          className={`flex h-[56px] shrink-0 items-center justify-between px-4 ${debtBanner.bg}`}
        >
          <p className={`text-sm font-medium ${debtBanner.textColor}`}>
            {debtBanner.text}
          </p>
          <button
            type="button"
            onClick={() => router.push("/debts")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${debtBanner.btnColor}`}
          >
            {debtBanner.action}
          </button>
        </div>
      )}

      {/* Chat feed */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          items={feedItems}
          members={members}
          billParticipantCounts={billParticipantCounts}
          billCheckins={billCheckins}
          currentMemberId={currentMember?.id ?? null}
          onCheckin={handleCheckin}
        />
      </div>

      {/* Input bar */}
      <ChatInputBar
        groupId={id}
        value={inputText}
        onChange={setInputText}
        onSend={handleSendText}
      />
    </div>
  );
}
