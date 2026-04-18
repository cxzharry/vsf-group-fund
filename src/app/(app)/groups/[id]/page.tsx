"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { BillConfirmSheet } from "@/components/chat/bill-confirm-sheet";
import { BillDetailsSheet } from "@/components/chat/bill-details-sheet";
import { AddPeopleSheet } from "@/components/chat/add-people-sheet";
import { AiFollowupCard } from "@/components/chat/ai-followup-card";
import { AiProcessingBubble } from "@/components/chat/ai-processing-bubble";
import { AiErrorBubble } from "@/components/chat/ai-error-bubble";
import { AiMultiAmountCard } from "@/components/chat/ai-multi-amount-card";
import { formatVND } from "@/lib/format-vnd";
import { toast } from "sonner";
import type {
  Group,
  Member,
  Bill,
  ChatMessage,
  BillCheckin,
  BillParticipant,
  Debt,
} from "@/lib/types";
import type { MessageFeedItem } from "@/components/chat/chat-message-list";
import type { ParsedBillIntent } from "@/lib/ai-intent-types";
import type { BillConfirmData } from "@/components/chat/bill-confirm-sheet";

// ─── component ───────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const cached = sessionStorage.getItem(`group_detail_${id}`);
      return cached ? JSON.parse(cached).group : null;
    } catch { return null; }
  });
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [bills, setBills] = useState<Bill[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem(`group_detail_${id}`);
      return cached ? JSON.parse(cached).bills : [];
    } catch { return []; }
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem(`group_detail_${id}`);
      return cached ? JSON.parse(cached).chatMessages : [];
    } catch { return []; }
  });
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
    /** Amount owed to/from the named counterparty specifically (not the net across all) */
    counterpartyAmount: number;
    /** # distinct creditors / debtors user has in this group — drives "+N khác" suffix */
    creditorCount: number;
    debtorCount: number;
    /** # debts from me to top creditor in this group (≥2 → aggregated transfer page) */
    topCreditorDebtCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(`group_detail_${id}`);
  });
  /** billId → remaining amount user owes on that bill (user = debtor, status pending/partial) */
  const [userOwedPerBill, setUserOwedPerBill] = useState<Record<string, number>>({});
  const [inputText, setInputText] = useState("");

  // Sprint 4: AI intent state
  const [pendingIntent, setPendingIntent] = useState<ParsedBillIntent | null>(null);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  // Sprint 7: show follow-up card inline when AI needs more info
  const [showFollowupCard, setShowFollowupCard] = useState(false);

  // AI parse UI state (processing / error / multi-amount picker)
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<null | "network" | "rate_limit" | "server">(null);
  const [lastParsedText, setLastParsedText] = useState<string | null>(null);
  const [showMultiAmount, setShowMultiAmount] = useState(false);

  // Sprint 5: open bill sheet state
  const [addPeopleBillId, setAddPeopleBillId] = useState<string | null>(null);

  // Delete bill confirmation dialog state
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);

  // Edit bill state
  const [editBillId, setEditBillId] = useState<string | null>(null);

  // US-E3-4: Bill detail sheet state
  const [detailBillId, setDetailBillId] = useState<string | null>(null);
  const [detailParticipants, setDetailParticipants] = useState<(BillParticipant & { member?: Member })[]>([]);
  const [detailDebts, setDetailDebts] = useState<(Debt & { debtor?: Member })[]>([]);

  // ─── data loading ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    // Phase 1: fetch group + group_members in parallel (independent)
    const [groupRes, gmRes] = await Promise.all([
      supabase.from("groups").select("*").eq("id", id).single(),
      supabase.from("group_members").select("member_id").eq("group_id", id),
    ]);

    const groupData = groupRes.data;
    if (!groupData) { setLoading(false); return; }
    setGroup(groupData);

    const memberIds = (gmRes.data ?? []).map((m: { member_id: string }) => m.member_id);
    setMemberCount(memberIds.length);

    // Phase 2: fetch members + bills + chat_messages in parallel (all independent)
    const [memberRes, billRes, msgRes] = await Promise.all([
      memberIds.length > 0
        ? supabase.from("members").select("*").in("id", memberIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("bills")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: true })
        .limit(50),
      supabase
        .from("chat_messages")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: true })
        .limit(100),
    ]);

    const memberData = memberRes.data ?? [];
    const map: Record<string, Member> = {};
    memberData.forEach((m: Member) => (map[m.id] = m));
    setMembers(map);
    setMemberList(memberData);

    const fetchedBills: Bill[] = billRes.data ?? [];
    setBills(fetchedBills);

    const fetchedMessages = msgRes.data ?? [];
    setChatMessages(fetchedMessages);

    // Phase 3: fetch bill sub-data + debts in parallel (two typed Promise.all to avoid TS union overload issues)
    const billIds = fetchedBills.map((b) => b.id);

    // 3a: bill sub-data
    const [partRes, checkinRes] = billIds.length > 0
      ? await Promise.all([
          supabase.from("bill_participants").select("bill_id").in("bill_id", billIds),
          supabase.from("bill_checkins").select("*").in("bill_id", billIds),
        ])
      : [{ data: [] as { bill_id: string }[] }, { data: [] as BillCheckin[] }];

    // 3b: debts for current member
    const [owingRes, owedRes] = currentMember
      ? await Promise.all([
          supabase
            .from("debts")
            .select("id, remaining, creditor_id, bill_id, bills!inner(group_id)")
            .eq("debtor_id", currentMember.id)
            .eq("bills.group_id", id)
            .in("status", ["pending", "partial"]),
          supabase
            .from("debts")
            .select("id, remaining, debtor_id, bills!inner(group_id)")
            .eq("creditor_id", currentMember.id)
            .eq("bills.group_id", id)
            .in("status", ["pending", "partial"]),
        ])
      : [{ data: null }, { data: null }];

    // Process bill_participants counts
    const counts: Record<string, number> = {};
    (partRes.data ?? []).forEach((p: { bill_id: string }) => {
      counts[p.bill_id] = (counts[p.bill_id] ?? 0) + 1;
    });
    setBillParticipantCounts(counts);

    // Process bill_checkins
    const checkinMap: Record<string, BillCheckin[]> = {};
    (checkinRes.data ?? []).forEach((c: BillCheckin) => {
      if (!checkinMap[c.bill_id]) checkinMap[c.bill_id] = [];
      checkinMap[c.bill_id].push(c);
    });
    setBillCheckins(checkinMap);

    // Process debts
    if (currentMember) {
      const owingData = owingRes.data as Array<{ id: string; remaining: number; creditor_id: string; bill_id?: string }> | null;
      const owedData = owedRes.data as Array<{ id: string; remaining: number; debtor_id: string }> | null;

      // Build per-bill "Bạn nợ X" map
      const owedMap: Record<string, number> = {};
      (owingData ?? []).forEach((d) => {
        if (d.bill_id && d.remaining > 0) {
          owedMap[d.bill_id] = (owedMap[d.bill_id] ?? 0) + d.remaining;
        }
      });
      setUserOwedPerBill(owedMap);

      // Pair-net per counterparty (simplified everywhere):
      //   pairNet[X] = Σ (X owes me) − Σ (I owe X). Positive → X net-owes me.
      const pairNet: Record<string, { net: number; myDebtIds: string[]; theirDebtIds: string[] }> = {};
      for (const d of owingData ?? []) {
        const cId = d.creditor_id;
        if (!pairNet[cId]) pairNet[cId] = { net: 0, myDebtIds: [], theirDebtIds: [] };
        pairNet[cId].net -= d.remaining;
        pairNet[cId].myDebtIds.push(d.id);
      }
      for (const d of owedData ?? []) {
        const dId = d.debtor_id;
        if (!pairNet[dId]) pairNet[dId] = { net: 0, myDebtIds: [], theirDebtIds: [] };
        pairNet[dId].net += d.remaining;
        pairNet[dId].theirDebtIds.push(d.id);
      }

      const pairs = Object.entries(pairNet);
      const creditorPairs = pairs.filter(([, p]) => p.net < -1);
      const debtorPairs = pairs.filter(([, p]) => p.net > 1);
      const net = pairs.reduce((s, [, p]) => s + p.net, 0);

      if (Math.abs(net) >= 1000) {
        let otherMemberId = "";
        let debtId: string | undefined;
        let counterpartyAmount = 0;
        let topCreditorDebtCount = 0;

        if (net < 0 && creditorPairs.length > 0) {
          const top = creditorPairs.sort((a, b) => a[1].net - b[1].net)[0];
          otherMemberId = top[0];
          counterpartyAmount = -top[1].net;
          topCreditorDebtCount = top[1].myDebtIds.length + top[1].theirDebtIds.length;
          if (top[1].myDebtIds.length === 1 && top[1].theirDebtIds.length === 0) {
            debtId = top[1].myDebtIds[0];
          }
        } else if (net > 0 && debtorPairs.length > 0) {
          const top = debtorPairs.sort((a, b) => b[1].net - a[1].net)[0];
          otherMemberId = top[0];
          counterpartyAmount = top[1].net;
        }
        setNetDebt({
          amount: net,
          otherMemberId,
          debtId,
          counterpartyAmount,
          creditorCount: creditorPairs.length,
          debtorCount: debtorPairs.length,
          topCreditorDebtCount,
        });
      } else {
        setNetDebt(null);
      }
    }

    try { sessionStorage.setItem(`group_detail_${id}`, JSON.stringify({ group: groupData, bills: fetchedBills, chatMessages: fetchedMessages })); } catch {}
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

  async function runParse(text: string) {
    setAiError(null);
    setAiProcessing(true);
    try {
      const res = await fetch("/api/ai/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.status === 429) {
        setAiProcessing(false);
        setAiError("rate_limit");
        return;
      }
      if (!res.ok) {
        setAiProcessing(false);
        setAiError("server");
        return;
      }
      const parsed: ParsedBillIntent = await res.json();
      setAiProcessing(false);
      if (!parsed.hasIntent) return;

      setTimeout(() => {
        setPendingIntent(parsed);
        // Multi-amount branch — show picker first
        if (parsed.alternates && parsed.alternates.length > 0) {
          setShowMultiAmount(true);
          setShowFollowupCard(false);
          return;
        }
        if (parsed.readyToConfirm) {
          setShowFollowupCard(false);
          setShowConfirmSheet(true);
        } else if (parsed.followUp) {
          setShowFollowupCard(true);
        }
      }, 0);
    } catch {
      setAiProcessing(false);
      setAiError("network");
    }
  }

  async function handleSendText() {
    if (!inputText.trim() || !currentMember) return;
    const text = inputText.trim();
    setInputText("");
    setLastParsedText(text);

    // Insert text message into chat
    await supabase.from("chat_messages").insert({
      group_id: id,
      sender_id: currentMember.id,
      message_type: "text",
      content: text,
    });

    await runParse(text);
  }

  function handleAiRetry() {
    if (lastParsedText) runParse(lastParsedText);
  }

  function handleAiManualFallback() {
    setAiError(null);
    setPendingIntent({
      hasIntent: true,
      intentType: "split",
      amount: null,
      description: lastParsedText,
      peopleCount: null,
      peopleNames: [],
      splitType: "equal",
      transferTo: null,
      readyToConfirm: false,
      followUp: null,
    });
    setShowConfirmSheet(true);
  }

  function handleMultiAmountSelect(amount: number) {
    if (!pendingIntent) return;
    const updated: ParsedBillIntent = {
      ...pendingIntent,
      amount,
      alternates: undefined,
      readyToConfirm: true,
    };
    setPendingIntent(updated);
    setShowMultiAmount(false);
    setShowConfirmSheet(true);
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

    // US-E3-10 Transfer Bill — no bill/debt records, just a transfer_card chat message
    if (data.billType === "transfer") {
      if (!data.recipientId) {
        toast.error("Thiếu người nhận");
        return;
      }
      const { error: msgError } = await supabase.from("chat_messages").insert({
        group_id: id,
        sender_id: currentMember.id,
        message_type: "transfer_card",
        content: data.description || "Chuyển tiền",
        metadata: {
          from_id: data.payerId,
          to_id: data.recipientId,
          amount: data.amount,
          description: data.description,
        },
      });
      if (msgError) {
        toast.error("Lỗi ghi nhận chuyển tiền");
        return;
      }
      // Optional: Telegram notify recipient (fire-and-forget)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer_sent",
          payload: {
            fromId: data.payerId,
            toId: data.recipientId,
            amount: data.amount,
            description: data.description,
          },
        }),
      }).catch(() => {});
      toast.success("Đã ghi nhận chuyển tiền");
      setShowConfirmSheet(false);
      setPendingIntent(null);
      return;
    }

    // 1. Insert bill (split flow)
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

    // 2. Create debts + bill_participants for standard bills (non-open)
    if (data.billType === "standard") {
      const guestCount = data.guestSplits?.length ?? 0;
      const anonCount = data.anonSplit?.count ?? 0;
      const memberCount = data.peopleCount;
      const totalHeadcount = memberCount + guestCount + anonCount;

      if (data.splitType === "equal" && totalHeadcount > 1) {
        const base = Math.floor(data.amount / totalHeadcount);
        const remainder = data.amount - base * totalHeadcount;
        // Bug-6: use selectedMemberIds when available; fallback to DB-order slice (backward compat)
        const otherParticipants = data.selectedMemberIds
          ? memberList.filter(
              (m) => m.id !== data.payerId && data.selectedMemberIds!.includes(m.id)
            )
          : memberList
              .filter((m) => m.id !== data.payerId)
              .slice(0, memberCount - 1);

        // Distribute remainder 1 VND at a time to non-payer members first, then payer
        // Index 0 = payer slot, 1..otherParticipants.length = non-payer members
        const payerAmount = base + (0 < remainder ? 1 : 0);
        // Member participants
        const memberInserts = [
          { bill_id: newBill.id, member_id: data.payerId, amount: payerAmount, guest_name: null, is_anonymous: false },
          ...otherParticipants.map((m, i) => ({
            bill_id: newBill.id, member_id: m.id, amount: base + (i + 1 < remainder ? 1 : 0), guest_name: null, is_anonymous: false,
          })),
        ];
        // Case C: named guests — no debt rows (payer tracks offline)
        const guestInserts = (data.guestSplits ?? []).map((g) => ({
          bill_id: newBill.id, member_id: null, amount: g.amount, guest_name: g.name, is_anonymous: false,
        }));
        // Case D: anonymous rows — no debt rows
        const anonInserts = Array.from({ length: anonCount }, () => ({
          bill_id: newBill.id, member_id: null, amount: data.anonSplit!.amountEach, guest_name: null, is_anonymous: true,
        }));

        await supabase.from("bill_participants").insert([...memberInserts, ...guestInserts, ...anonInserts]);

        // Debts only for non-payer members (with remainder distribution: index 0 = payer, 1+ = debtors)
        const debtInserts = otherParticipants.map((m, i) => {
          const debtAmount = base + (i + 1 < remainder ? 1 : 0);
          return {
            bill_id: newBill.id,
            debtor_id: m.id,
            creditor_id: data.payerId,
            amount: debtAmount,
            remaining: debtAmount,
            status: "pending" as const,
          };
        });
        if (debtInserts.length > 0) {
          await supabase.from("debts").insert(debtInserts);
        }
      } else if (data.splitType === "custom" && data.customSplits) {
        // Custom splits: use exact amounts from SplitSheet
        const customInserts = Object.entries(data.customSplits).map(([memberId, amt]) => ({
          bill_id: newBill.id, member_id: memberId, amount: amt, guest_name: null, is_anonymous: false,
        }));
        const guestInserts = (data.guestSplits ?? []).map((g) => ({
          bill_id: newBill.id, member_id: null, amount: g.amount, guest_name: g.name, is_anonymous: false,
        }));
        const anonInserts = Array.from({ length: anonCount }, () => ({
          bill_id: newBill.id, member_id: null, amount: data.anonSplit!.amountEach, guest_name: null, is_anonymous: true,
        }));
        await supabase.from("bill_participants").insert([...customInserts, ...guestInserts, ...anonInserts]);

        // Debts for non-payer members
        const debtInserts = Object.entries(data.customSplits)
          .filter(([memberId]) => memberId !== data.payerId)
          .map(([memberId, amt]) => ({
            bill_id: newBill.id,
            debtor_id: memberId,
            creditor_id: data.payerId,
            amount: amt,
            remaining: amt,
            status: "pending" as const,
          }));
        if (debtInserts.length > 0) {
          await supabase.from("debts").insert(debtInserts);
        }
      }
    }

    // 3. Insert bill_card chat message (category stored in metadata — no DB migration needed)
    await supabase.from("chat_messages").insert({
      group_id: id,
      sender_id: currentMember.id,
      message_type: "bill_card",
      content: data.description,
      metadata: { bill_id: newBill.id, category: data.category },
    });

    // 4. Send Telegram notification (fire-and-forget)
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_bill",
        payload: {
          billId: newBill.id,
          billTitle: data.description,
          totalAmount: data.amount,
          paidById: data.payerId,
        },
      }),
    }).catch(() => {});

    // 5. Update local state
    try { sessionStorage.removeItem(`group_detail_${id}`); } catch {}
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

    // Notify bill creator via Telegram (fire-and-forget)
    const checkinCountAfter = (billCheckins[billId] ?? []).length + 1;
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "open_bill_checkin",
        payload: {
          billId,
          memberName: currentMember.display_name,
          totalCheckins: checkinCountAfter,
        },
      }),
    }).catch(() => {});

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
  // Decision 2026-04-18: "Đóng bill" button removed — bill uses standard edit/delete
  // via ⋯ menu. This function kept dormant for future auto-close-on-full trigger or
  // ⋯-menu close option. If still unused after US-E3-5 finalizes, remove entirely.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Create equal debts for all checked-in members (excluding payer)
    const debtors = checkins.filter((c) => c.member_id && c.member_id !== bill.paid_by);
    const totalParticipants = checkins.length; // everyone splits including payer
    const base = Math.floor(bill.total_amount / totalParticipants);
    const remainder = bill.total_amount - base * totalParticipants;
    const debtInserts = debtors
      .map((c, i) => {
        const amount = base + (i < remainder ? 1 : 0);
        return {
          bill_id: billId,
          debtor_id: c.member_id!,
          creditor_id: bill.paid_by,
          amount,
          remaining: amount,
          status: "pending" as const,
        };
      });

    if (debtInserts.length > 0) {
      await supabase.from("debts").insert(debtInserts);
    }

    // Insert system chat message on close
    await supabase.from("chat_messages").insert({
      group_id: id,
      sender_id: currentMember.id,
      message_type: "system",
      content: `Bill "${bill.title ?? "open bill"}" đã đóng — ${debtors.length} người chia tiền.`,
      metadata: { bill_id: billId },
    });

    // Notify participants via Telegram (fire-and-forget)
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "open_bill_closed",
        payload: { billId },
      }),
    }).catch(() => {});

    // Update local bills state
    setTimeout(() => {
      setBills((prev) =>
        prev.map((b) => b.id === billId ? { ...b, status: "closed" } : b)
      );
    }, 0);

    toast.success("Đã đóng bill!");
  }

  // ─── Delete bill ───────────────────────────────────────────────────────────

  async function handleDeleteBill(billId: string) {
    if (!currentMember) return;

    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    // Guard: only the bill creator can delete
    if (bill.paid_by !== currentMember.id) {
      toast.error("Chỉ người tạo bill mới có thể xóa");
      return;
    }

    try {
      // 1. Delete related debts
      await supabase.from("debts").delete().eq("bill_id", billId);
      // 2. Delete bill_participants
      await supabase.from("bill_participants").delete().eq("bill_id", billId);
      // 3. Delete bill_checkins (for open bills)
      await supabase.from("bill_checkins").delete().eq("bill_id", billId);
      // 4. Delete the bill row
      const { error } = await supabase.from("bills").delete().eq("id", billId);
      if (error) { toast.error("Lỗi xóa bill"); return; }
      // 5. Delete the bill_card chat message
      await supabase
        .from("chat_messages")
        .delete()
        .eq("group_id", id)
        .contains("metadata", { bill_id: billId });
    } catch {
      toast.error("Lỗi xóa bill");
      return;
    }

    // Update local state
    try { sessionStorage.removeItem(`group_detail_${id}`); } catch {}
    setTimeout(() => {
      setBills((prev) => prev.filter((b) => b.id !== billId));
      setChatMessages((prev) =>
        prev.filter((m) => {
          const meta = m.metadata as { bill_id?: string } | null;
          return meta?.bill_id !== billId;
        })
      );
    }, 0);

    toast.success("Đã xóa bill");
  }

  // ─── Edit bill ─────────────────────────────────────────────────────────────

  async function handleEditBill(data: BillConfirmData) {
    if (!currentMember || !editBillId) return;

    const bill = bills.find((b) => b.id === editBillId);
    if (!bill) return;

    try {
      // 1. Fetch existing debts for this bill
      const { data: existingDebts, error: debtFetchErr } = await supabase
        .from("debts")
        .select("id, debtor_id, amount, remaining, status")
        .eq("bill_id", editBillId);

      if (debtFetchErr) { toast.error("Lỗi tải dữ liệu bill"); return; }

      // 2. Block if any debt already closed (status=confirmed means debtor marked "Đã chuyển tiền")
      const hasClosedDebt = (existingDebts ?? []).some((d: { status: string }) => d.status === "confirmed");
      if (hasClosedDebt) {
        toast.error("Không thể sửa: bill đã có khoản nợ được thanh toán");
        return;
      }

      // 4. UPDATE bill
      const { error: billUpdateErr } = await supabase
        .from("bills")
        .update({
          title: data.description,
          total_amount: data.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editBillId);

      if (billUpdateErr) { toast.error("Lỗi cập nhật bill"); return; }

      // 5. Recompute per-person and update pending debts
      const pendingDebts = (existingDebts ?? []).filter(
        (d: { status: string }) => d.status === "pending"
      );

      if (pendingDebts.length > 0) {
        // Use original total headcount (all debts + 1 payer), NOT just pending debtors.
        // Confirmed debtors already paid their share; the payer was reimbursed by them.
        // Redistributing over (pending + 1) would overcharge remaining debtors.
        const totalDebtors = (existingDebts ?? []).length; // all non-payer participants
        const totalHeadcountEdit = totalDebtors + 1; // +1 for payer
        const newPer = Math.floor(data.amount / totalHeadcountEdit);
        const remainder = data.amount - newPer * totalHeadcountEdit;

        for (let i = 0; i < pendingDebts.length; i++) {
          const debt = pendingDebts[i] as { id: string; amount: number; remaining: number };
          const newAmount = newPer + (i < remainder ? 1 : 0);
          const delta = newAmount - debt.amount;
          const newRemaining = Math.max(0, debt.remaining + delta);
          const newStatus = newRemaining <= 0 ? "paid" : "pending";

          await supabase
            .from("debts")
            .update({ amount: newAmount, remaining: newRemaining, status: newStatus })
            .eq("id", debt.id);
        }
      }

      // 6. Update local state
      try { sessionStorage.removeItem(`group_detail_${id}`); } catch {}
      setTimeout(() => {
        setBills((prev) =>
          prev.map((b) =>
            b.id === editBillId
              ? { ...b, title: data.description, total_amount: data.amount, updated_at: new Date().toISOString() }
              : b
          )
        );
        setEditBillId(null);
      }, 0);

      toast.success("Đã cập nhật bill");
    } catch {
      toast.error("Lỗi cập nhật bill");
    }
  }

  // ─── US-E3-4: auto-open sheet from ?billDetail= query param (deep-link) ──

  useEffect(() => {
    const billDetailParam = searchParams.get("billDetail");
    if (!billDetailParam || loading) return;
    // Trigger once data is loaded; clear param from URL immediately
    router.replace(`/groups/${id}`, { scroll: false });
    handleViewBill(billDetailParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ─── US-E3-4: open bill detail sheet ──────────────────────────────────────

  async function handleViewBill(billId: string) {
    setDetailBillId(billId);

    // Fetch participants + debts in parallel (light reads — no heavy joins needed)
    const [partRes, debtRes] = await Promise.all([
      supabase
        .from("bill_participants")
        .select("*")
        .eq("bill_id", billId)
        .order("amount", { ascending: false }),
      supabase
        .from("debts")
        .select("*")
        .eq("bill_id", billId),
    ]);

    const parts = (partRes.data ?? []).map((p: BillParticipant) => ({
      ...p,
      member: p.member_id ? members[p.member_id] : undefined,
    }));
    const debtsWithMember = (debtRes.data ?? []).map((d: Debt) => ({
      ...d,
      debtor: members[d.debtor_id],
    }));

    setDetailParticipants(parts);
    setDetailDebts(debtsWithMember);
  }

  async function handleNudge(billId: string) {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;
    // Fire-and-forget Telegram nudge to all pending debtors
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "nudge_debtors",
        payload: { billId, billTitle: bill.title },
      }),
    }).catch(() => {});
    toast.success("Đã gửi nhắc nợ");
  }

  // ─── build feed items ──────────────────────────────────────────────────────

  // Build a map of bill_id → category from bill_card chat messages
  const billCategoryMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of chatMessages) {
      if (m.message_type === "bill_card" && m.metadata) {
        const meta = m.metadata as { bill_id?: string; category?: string };
        if (meta.bill_id && meta.category) {
          map[meta.bill_id] = meta.category;
        }
      }
    }
    return map;
  }, [chatMessages]);

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
      const suffix = netDebt.creditorCount > 1 ? ` và ${netDebt.creditorCount - 1} người khác` : "";
      // Route: single debt → transfer/{id} matches counterpartyAmount exactly.
      // Multi debt to top creditor → aggregated transfer page with correct total.
      const href = netDebt.debtId
        ? `/transfer/${netDebt.debtId}`
        : `/transfer/creditor/${netDebt.otherMemberId}?group=${id}`;
      return {
        text: `Bạn nợ ${otherDisplayName} ${formatVND(netDebt.counterpartyAmount)}đ${suffix}`,
        action: "Trả nợ",
        bg: "bg-[#FFF3F0]",
        textColor: "text-[#FF3B30]",
        btnColor: "bg-[#FF3B30] text-white",
        href,
      };
    }
    const suffix = netDebt.debtorCount > 1 ? ` và ${netDebt.debtorCount - 1} người khác` : "";
    return {
      text: `${otherDisplayName} nợ bạn ${formatVND(netDebt.counterpartyAmount)}đ${suffix}`,
      action: "Nhắc nợ",
      bg: "bg-[#F0FFF4]",
      textColor: "text-[#34C759]",
      btnColor: "bg-[#34C759] text-white",
      href: `/groups/${id}/settings`,
    };
  }, [netDebt, members, id]);

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
        <p className="text-sm text-[#AEAEB2]">Không tìm thấy nhóm</p>
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
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F2F2F7]"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <p className="text-[17px] font-semibold text-[#1C1C1E]">{group.name}</p>
          <p className="text-[13px] text-[#AEAEB2]">{memberCount} thành viên</p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/groups/${id}/settings`)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F2F2F7]"
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
            onClick={() => debtBanner.href && router.push(debtBanner.href)}
            disabled={!debtBanner.href}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${debtBanner.btnColor}`}
          >
            {debtBanner.action}
          </button>
        </div>
      )}

      {/* Chat feed */}
      <div className="flex-1 overflow-y-auto">
        {feedItems.length === 0 ? (
          /* Empty state: shown when group has no bills or messages yet */
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C7C7CC"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-base font-bold text-[#1C1C1E]">Chưa có hoạt động nào</p>
            <p className="text-sm text-[#8E8E93]">Mời thêm thành viên hoặc gõ bill để bắt đầu</p>
            {group.invite_code && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(group.invite_code).then(() => {
                    toast.success(`Đã sao chép mã mời: ${group.invite_code}`);
                  }).catch(() => {
                    toast.info(`Mã mời: ${group.invite_code}`);
                  });
                }}
                className="mt-1 flex items-center gap-2 rounded-[14px] border border-[#3A5CCC] px-5 py-2.5 text-sm font-semibold text-[#3A5CCC] transition-colors active:bg-[#EEF2FF]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Chia sẻ mã mời
              </button>
            )}
          </div>
        ) : (
          <ChatMessageList
            items={feedItems}
            members={members}
            billParticipantCounts={billParticipantCounts}
            billCheckins={billCheckins}
            billCategoryMap={billCategoryMap}
            userOwedPerBill={userOwedPerBill}
            currentMemberId={currentMember?.id ?? null}
            onCheckin={handleCheckin}
            onAddPeople={(billId) => setAddPeopleBillId(billId)}
            onDeleteBill={(billId) => setDeleteBillId(billId)}
            onEditBill={(billId) => setEditBillId(billId)}
            onViewBill={handleViewBill}
          />
        )}
      </div>

      {/* AI processing (typing dots) */}
      {aiProcessing && (
        <div className="shrink-0 bg-[#F2F2F7] pb-1">
          <AiProcessingBubble />
        </div>
      )}

      {/* AI error — retry / manual fallback */}
      {aiError && !aiProcessing && (
        <div className="shrink-0 bg-[#F2F2F7] pb-1">
          <AiErrorBubble
            kind={aiError}
            onRetry={handleAiRetry}
            onManualFallback={handleAiManualFallback}
          />
        </div>
      )}

      {/* Multi-amount picker */}
      {showMultiAmount && pendingIntent?.amount != null && (
        <div className="shrink-0 bg-[#F2F2F7] pb-1">
          <AiMultiAmountCard
            primary={pendingIntent.amount}
            alternates={
              (pendingIntent.alternates ?? []).map((a) => a.amount)
            }
            onSelectAmount={handleMultiAmountSelect}
          />
        </div>
      )}

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
        value={inputText}
        onChange={setInputText}
        onSend={handleSendText}
        onOpenManualBill={() => {
          // US-E3-1 manual flow: open Confirm Sheet with blank intent
          setPendingIntent({
            hasIntent: true,
            intentType: "split",
            amount: null,
            description: null,
            peopleCount: null,
            peopleNames: [],
            splitType: "equal",
            transferTo: null,
            readyToConfirm: false,
            followUp: null,
          });
          setShowConfirmSheet(true);
        }}
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

      {/* Edit bill sheet */}
      {editBillId && currentMember && (() => {
        const editingBill = bills.find((b) => b.id === editBillId);
        if (!editingBill) return null;
        const editIntent = {
          hasIntent: true,
          intentType: "split" as const,
          amount: editingBill.total_amount,
          description: editingBill.title,
          splitType: (editingBill.split_type as "equal" | "custom" | "open") ?? "equal",
          peopleCount: billParticipantCounts[editBillId] ?? 1,
          peopleNames: [] as string[],
          transferTo: null,
          readyToConfirm: true,
          followUp: null,
        };
        return (
          <BillConfirmSheet
            intent={editIntent}
            groupMembers={memberList}
            currentMember={currentMember}
            mode="edit"
            initialData={{
              amount: editingBill.total_amount,
              description: editingBill.title,
              category: (billCategoryMap[editBillId] ?? "khac") as import("@/lib/bill-categories").BillCategoryId,
            }}
            onConfirm={handleEditBill}
            onClose={() => setEditBillId(null)}
          />
        );
      })()}

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

      {/* US-E3-4: Bill detail sheet */}
      {detailBillId && (() => {
        const detailBill = bills.find((b) => b.id === detailBillId);
        if (!detailBill) return null;
        return (
          <BillDetailsSheet
            bill={detailBill}
            payer={members[detailBill.paid_by] ?? null}
            participants={detailParticipants}
            debts={detailDebts}
            currentMemberId={currentMember?.id ?? null}
            onClose={() => { setDetailBillId(null); setDetailParticipants([]); setDetailDebts([]); }}
            onEdit={(billId) => { setDetailBillId(null); setEditBillId(billId); }}
            onDelete={(billId) => { setDetailBillId(null); setDeleteBillId(billId); }}
            onNudge={handleNudge}
            onPayOwnDebt={(debtId) => { setDetailBillId(null); router.push(`/transfer/${debtId}`); }}
          />
        );
      })()}

      {/* Delete bill confirmation dialog */}
      {deleteBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-[14px] bg-white p-5 shadow-xl">
            <h3 className="text-[17px] font-semibold text-[#1C1C1E]">Xóa bill?</h3>
            <p className="mt-2 text-[14px] text-[#8E8E93]">
              Thao tác này không thể hoàn tác. Tất cả khoản nợ liên quan cũng sẽ bị xóa.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteBillId(null)}
                className="flex-1 rounded-[14px] border border-[#E5E5EA] py-2.5 text-sm font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => { const bid = deleteBillId; setDeleteBillId(null); handleDeleteBill(bid); }}
                className="flex-1 rounded-[14px] bg-[#FF3B30] py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Xóa bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
