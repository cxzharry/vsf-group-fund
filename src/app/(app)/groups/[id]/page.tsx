"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { BillConfirmSheet } from "@/components/chat/bill-confirm-sheet";
import { AddPeopleSheet } from "@/components/chat/add-people-sheet";
import { AiFollowupCard } from "@/components/chat/ai-followup-card";
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
import type { ParsedBillIntent } from "@/lib/ai-intent-types";
import type { BillConfirmData } from "@/components/chat/bill-confirm-sheet";

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
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [billParticipantCounts, setBillParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [billCheckins, setBillCheckins] = useState<
    Record<string, BillCheckin[]>
  >({});
  const [netDebt, setNetDebt] = useState<{
    amount: number;
    otherMemberId: string;
    debtId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");

  // Sprint 4: AI intent state
  const [pendingIntent, setPendingIntent] = useState<ParsedBillIntent | null>(null);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  // Sprint 7: show follow-up card inline when AI needs more info
  const [showFollowupCard, setShowFollowupCard] = useState(false);

  // Sprint 5: open bill sheet state
  const [addPeopleBillId, setAddPeopleBillId] = useState<string | null>(null);

  // ─── data loading ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .single();
    if (!groupData) { setLoading(false); return; }
    setGroup(groupData);

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
      setMemberList(memberData ?? []);
    }

    const { data: billData } = await supabase
      .from("bills")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: true });
    const fetchedBills: Bill[] = billData ?? [];
    setBills(fetchedBills);

    if (fetchedBills.length > 0) {
      const billIds = fetchedBills.map((b) => b.id);

      const { data: partData } = await supabase
        .from("bill_participants")
        .select("bill_id")
        .in("bill_id", billIds);
      const counts: Record<string, number> = {};
      (partData ?? []).forEach((p: { bill_id: string }) => {
        counts[p.bill_id] = (counts[p.bill_id] ?? 0) + 1;
      });
      setBillParticipantCounts(counts);

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

    const { data: msgData } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: true });
    setChatMessages(msgData ?? []);

    if (currentMember) {
      const { data: owingData } = await supabase
        .from("debts")
        .select("id, remaining, creditor_id, bills!inner(group_id)")
        .eq("debtor_id", currentMember.id)
        .eq("bills.group_id", id)
        .in("status", ["pending", "partial"]);

      const { data: owedData } = await supabase
        .from("debts")
        .select("id, remaining, debtor_id, bills!inner(group_id)")
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
        let debtId: string | undefined;
        if (net < 0 && owingData && owingData.length > 0) {
          const biggest = (
            owingData as Array<{ id: string; remaining: number; creditor_id: string }>
          ).sort((a, b) => b.remaining - a.remaining)[0];
          otherMemberId = biggest.creditor_id;
          debtId = biggest.id;
        } else if (net > 0 && owedData && owedData.length > 0) {
          const biggest = (
            owedData as Array<{ id: string; remaining: number; debtor_id: string }>
          ).sort((a, b) => b.remaining - a.remaining)[0];
          otherMemberId = biggest.debtor_id;
          debtId = biggest.id;
        }
        setNetDebt({ amount: net, otherMemberId, debtId });
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

  // ─── realtime: chat messages ───────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `group_id=eq.${id}` },
        (payload) => {
          setTimeout(() => {
            setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
          }, 0);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, supabase]);

  // ─── realtime: bill checkins ───────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`checkins:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bill_checkins" },
        (payload) => {
          const newCheckin = payload.new as BillCheckin;
          setTimeout(() => {
            setBillCheckins((prev) => {
              const existing = prev[newCheckin.bill_id] ?? [];
              // Avoid duplicates
              if (existing.some((c) => c.id === newCheckin.id)) return prev;
              return { ...prev, [newCheckin.bill_id]: [...existing, newCheckin] };
            });
          }, 0);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, supabase]);

  // ─── Sprint 4: AI parse + send text ───────────────────────────────────────

  async function handleSendText() {
    if (!inputText.trim() || !currentMember) return;
    const text = inputText.trim();
    setInputText("");

    // Insert text message into chat
    await supabase.from("chat_messages").insert({
      group_id: id,
      sender_id: currentMember.id,
      message_type: "text",
      content: text,
    });

    // Parse intent
    try {
      const res = await fetch("/api/ai/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) return;
      const parsed: ParsedBillIntent = await res.json();
      if (!parsed.hasIntent) return;

      setTimeout(() => {
        setPendingIntent(parsed);
        if (parsed.readyToConfirm) {
          setShowFollowupCard(false);
          setShowConfirmSheet(true);
        } else if (parsed.followUp) {
          setShowFollowupCard(true);
        }
      }, 0);
    } catch {
      // Silent fail — chat still works
    }
  }

  // ─── Sprint 7: handle follow-up option selection ──────────────────────────

  function handleFollowupSelect(value: string) {
    if (!pendingIntent) return;
    // Merge user answer into pending intent
    const updated: ParsedBillIntent = { ...pendingIntent };
    // Map common follow-up values into intent fields
    if (value === "open" || value === "equal" || value === "custom") {
      updated.splitType = value as "open" | "equal" | "custom";
    } else if (!isNaN(Number(value))) {
      updated.peopleCount = Number(value);
    }
    // After user answered, mark as readyToConfirm if we have the minimum info
    updated.readyToConfirm = !!(updated.amount && updated.intentType !== "unknown");
    updated.followUp = null;

    setTimeout(() => {
      setPendingIntent(updated);
      setShowFollowupCard(false);
      if (updated.readyToConfirm) {
        setShowConfirmSheet(true);
      }
    }, 0);
  }

  // ─── Sprint 4: create bill from confirm sheet ──────────────────────────────

  async function handleBillConfirm(data: BillConfirmData) {
    if (!currentMember) return;

    // 1. Insert bill
    const { data: newBill, error: billError } = await supabase
      .from("bills")
      .insert({
        title: data.description,
        total_amount: data.amount,
        paid_by: data.payerId,
        split_type: data.splitType === "open" ? "equal" : data.splitType,
        bill_type: data.billType,
        status: "active",
        group_id: id,
        created_by: currentMember.id,
      })
      .select()
      .single();

    if (billError || !newBill) {
      toast.error("Lỗi tạo bill");
      return;
    }

    // 2. Create equal debts for standard bills (non-open)
    if (data.billType === "standard" && data.splitType === "equal" && data.peopleCount > 1) {
      const perPerson = Math.floor(data.amount / data.peopleCount);
      // Create debt: current members owe the payer
      const debtInserts = memberList
        .filter((m) => m.id !== data.payerId)
        .slice(0, data.peopleCount - 1)
        .map((m) => ({
          bill_id: newBill.id,
          debtor_id: m.id,
          creditor_id: data.payerId,
          amount: perPerson,
          remaining: perPerson,
          status: "pending" as const,
        }));
      if (debtInserts.length > 0) {
        await supabase.from("debts").insert(debtInserts);
      }
    }

    // 3. Insert bill_card chat message
    await supabase.from("chat_messages").insert({
      group_id: id,
      sender_id: currentMember.id,
      message_type: "bill_card",
      content: data.description,
      metadata: { bill_id: newBill.id },
    });

    // 4. Update local state
    setTimeout(() => {
      setBills((prev) => [...prev, newBill as Bill]);
      setShowConfirmSheet(false);
      setPendingIntent(null);
    }, 0);

    toast.success("Đã tạo bill!");
  }

  // ─── Sprint 5: check-in ────────────────────────────────────────────────────

  async function handleCheckin(billId: string) {
    if (!currentMember) return toast.error("Bạn chưa đăng nhập");

    const { error } = await supabase.from("bill_checkins").insert({
      bill_id: billId,
      member_id: currentMember.id,
      added_by: currentMember.id,
    });

    if (error) { toast.error("Lỗi check-in"); return; }
    toast.success("Đã check-in!");

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

  // ─── Sprint 5: add person to open bill ────────────────────────────────────

  async function handleAddPerson(
    memberId: string | null,
    guestName?: string
  ) {
    if (!currentMember || !addPeopleBillId) return;

    const { error } = await supabase.from("bill_checkins").insert({
      bill_id: addPeopleBillId,
      member_id: memberId ?? null,
      guest_name: guestName ?? null,
      added_by: currentMember.id,
    });

    if (error) { toast.error("Lỗi thêm người"); return; }
    toast.success(guestName ? `Đã thêm ${guestName}` : "Đã thêm thành viên");

    setTimeout(() => {
      setBillCheckins((prev) => {
        const existing = prev[addPeopleBillId] ?? [];
        const newCheckin: BillCheckin = {
          id: crypto.randomUUID(),
          bill_id: addPeopleBillId,
          member_id: memberId,
          guest_name: guestName ?? null,
          added_by: currentMember.id,
          checked_in_at: new Date().toISOString(),
        };
        return { ...prev, [addPeopleBillId]: [...existing, newCheckin] };
      });
    }, 0);
  }

  // ─── Sprint 5: close open bill ─────────────────────────────────────────────

  async function handleCloseBill(billId: string) {
    if (!currentMember) return;

    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    const checkins = billCheckins[billId] ?? [];
    if (checkins.length === 0) {
      toast.error("Chưa có ai check-in");
      return;
    }

    // Close the bill
    const { error } = await supabase
      .from("bills")
      .update({ status: "closed" })
      .eq("id", billId);

    if (error) { toast.error("Lỗi đóng bill"); return; }

    // Create equal debts for all checked-in members
    const perPerson = Math.floor(bill.total_amount / checkins.length);
    const debtInserts = checkins
      .filter((c) => c.member_id && c.member_id !== bill.paid_by)
      .map((c) => ({
        bill_id: billId,
        debtor_id: c.member_id!,
        creditor_id: bill.paid_by,
        amount: perPerson,
        remaining: perPerson,
        status: "pending" as const,
      }));

    if (debtInserts.length > 0) {
      await supabase.from("debts").insert(debtInserts);
    }

    // Update local bills state
    setTimeout(() => {
      setBills((prev) =>
        prev.map((b) => b.id === billId ? { ...b, status: "closed" } : b)
      );
    }, 0);

    toast.success("Đã đóng bill!");
  }

  // ─── build feed items ──────────────────────────────────────────────────────

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
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [bills, chatMessages]);

  // ─── debt banner ───────────────────────────────────────────────────────────

  const debtBanner = useMemo(() => {
    if (!netDebt || Math.abs(netDebt.amount) < 1000) return null;
    const otherMember = members[netDebt.otherMemberId];
    const otherDisplayName = otherMember?.display_name ?? "thành viên";

    if (netDebt.amount < 0) {
      return {
        text: `Bạn nợ ${otherDisplayName} ${formatVND(Math.abs(netDebt.amount))}đ`,
        action: "Trả nợ",
        bg: "bg-[#FFF3F0]",
        textColor: "text-red-600",
        btnColor: "bg-red-500 text-white",
        href: netDebt.debtId ? `/transfer/${netDebt.debtId}` : "/debts",
      };
    }
    return {
      text: `${otherDisplayName} nợ bạn ${formatVND(netDebt.amount)}đ`,
      action: "Nhắc nợ",
      bg: "bg-[#F0FFF4]",
      textColor: "text-green-600",
      btnColor: "bg-green-500 text-white",
      href: "/debts",
    };
  }, [netDebt, members]);

  // ─── add people sheet bill ─────────────────────────────────────────────────

  const addPeopleBill = addPeopleBillId
    ? bills.find((b) => b.id === addPeopleBillId)
    : null;

  // ─── render ────────────────────────────────────────────────────────────────

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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </header>

      {/* Debt banner */}
      {debtBanner && (
        <div className={`flex h-[56px] shrink-0 items-center justify-between px-4 ${debtBanner.bg}`}>
          <p className={`text-sm font-medium ${debtBanner.textColor}`}>
            {debtBanner.text}
          </p>
          <button
            type="button"
            onClick={() => router.push(debtBanner.href)}
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
          onAddPeople={(billId) => setAddPeopleBillId(billId)}
          onCloseBill={handleCloseBill}
        />
      </div>

      {/* Sprint 7: AI follow-up card shown inline when AI needs more info */}
      {showFollowupCard && pendingIntent?.followUp && (
        <div className="shrink-0 bg-[#F2F2F7] pb-1">
          <AiFollowupCard
            followUp={pendingIntent.followUp}
            onSelectOption={(value) => handleFollowupSelect(value)}
          />
        </div>
      )}

      {/* Input bar */}
      <ChatInputBar
        groupId={id}
        value={inputText}
        onChange={setInputText}
        onSend={handleSendText}
      />

      {/* Sprint 4: Bill confirm sheet */}
      {showConfirmSheet && pendingIntent && currentMember && (
        <BillConfirmSheet
          intent={pendingIntent}
          groupMembers={memberList}
          currentMember={currentMember}
          onConfirm={handleBillConfirm}
          onClose={() => { setShowConfirmSheet(false); setPendingIntent(null); }}
        />
      )}

      {/* Sprint 5: Add people sheet */}
      {addPeopleBillId && addPeopleBill && (
        <AddPeopleSheet
          billId={addPeopleBillId}
          groupMembers={memberList}
          checkedInMembers={billCheckins[addPeopleBillId] ?? []}
          onAdd={handleAddPerson}
          onClose={() => setAddPeopleBillId(null)}
        />
      )}
    </div>
  );
}
