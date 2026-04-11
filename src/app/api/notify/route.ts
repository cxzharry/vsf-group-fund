import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  notifyNewBill,
  notifyNewDebt,
  notifyPaymentClaim,
  notifyPaymentConfirmed,
  notifyOpenBillCreated,
  notifyOpenBillCheckin,
  notifyOpenBillClosed,
} from "@/lib/notifications";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Internal API for sending Telegram notifications.
 * Called by client-side after creating bills, confirming payments, etc.
 */
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "missing config" });
  }

  const { type, payload } = await request.json();

  switch (type) {
    case "new_bill": {
      const { billId, billTitle, totalAmount, paidById } = payload;

      const { data: debts } = await supabase
        .from("debts")
        .select("debtor_id, amount")
        .eq("bill_id", billId);

      const { data: creditor } = await supabase
        .from("members")
        .select("display_name, telegram_chat_id")
        .eq("id", paidById)
        .single();

      if (debts) {
        const debtorIds = debts.map((d) => d.debtor_id);
        const { data: debtors } = await supabase
          .from("members")
          .select("id, telegram_chat_id")
          .in("id", debtorIds);

        const debtorMap = new Map(debtors?.map((d) => [d.id, d]) ?? []);

        for (const debt of debts) {
          const debtor = debtorMap.get(debt.debtor_id);
          await notifyNewDebt({
            debtorChatId: debtor?.telegram_chat_id ?? null,
            creditorName: creditor?.display_name ?? "?",
            amount: debt.amount,
            billTitle,
          });
        }
      }

      // Notify creditor about the bill
      await notifyNewBill({
        creditorChatId: creditor?.telegram_chat_id ?? null,
        billTitle,
        totalAmount,
        participantCount: (debts?.length ?? 0) + 1,
      });

      break;
    }

    case "payment_claim": {
      // Debtor claims they paid — notify creditor
      const { debtId, method } = payload;

      const { data: debt } = await supabase
        .from("debts")
        .select("creditor_id, amount, debtor_id")
        .eq("id", debtId)
        .single();

      if (debt) {
        const { data: creditor } = await supabase
          .from("members")
          .select("telegram_chat_id")
          .eq("id", debt.creditor_id)
          .single();

        const { data: debtor } = await supabase
          .from("members")
          .select("display_name")
          .eq("id", debt.debtor_id)
          .single();

        await notifyPaymentClaim({
          creditorChatId: creditor?.telegram_chat_id ?? null,
          debtorName: debtor?.display_name ?? "?",
          amount: debt.amount,
          method,
        });
      }
      break;
    }

    case "payment_confirmed": {
      // Creditor confirmed — notify debtor
      const { debtId: confirmedDebtId } = payload;

      const { data: debt } = await supabase
        .from("debts")
        .select("debtor_id, amount, creditor_id")
        .eq("id", confirmedDebtId)
        .single();

      if (debt) {
        const { data: debtor } = await supabase
          .from("members")
          .select("telegram_chat_id")
          .eq("id", debt.debtor_id)
          .single();

        const { data: creditor } = await supabase
          .from("members")
          .select("display_name")
          .eq("id", debt.creditor_id)
          .single();

        await notifyPaymentConfirmed({
          debtorChatId: debtor?.telegram_chat_id ?? null,
          creditorName: creditor?.display_name ?? "?",
          amount: debt.amount,
        });
      }
      break;
    }

    case "open_bill_created": {
      // Notify all group members that an open bill was created
      const { billTitle: obTitle, totalAmount: obAmount, creatorId, groupId } = payload;

      const { data: creator } = await supabase
        .from("members")
        .select("display_name")
        .eq("id", creatorId)
        .single();

      const { data: groupMembers } = await supabase
        .from("group_members")
        .select("member_id")
        .eq("group_id", groupId);

      if (groupMembers && groupMembers.length > 0) {
        const memberIds = groupMembers.map((gm: { member_id: string }) => gm.member_id);
        const { data: members } = await supabase
          .from("members")
          .select("id, telegram_chat_id")
          .in("id", memberIds);

        for (const m of members ?? []) {
          if (m.id === creatorId) continue;
          await notifyOpenBillCreated({
            memberChatId: m.telegram_chat_id ?? null,
            creatorName: creator?.display_name ?? "?",
            billTitle: obTitle,
            totalAmount: obAmount,
          });
        }
      }
      break;
    }

    case "open_bill_checkin": {
      // Notify bill creator when someone checks in
      const { billId: cisBillId, memberName, totalCheckins } = payload;

      const { data: bill } = await supabase
        .from("bills")
        .select("title, paid_by")
        .eq("id", cisBillId)
        .single();

      if (bill) {
        const { data: payer } = await supabase
          .from("members")
          .select("telegram_chat_id")
          .eq("id", bill.paid_by)
          .single();

        await notifyOpenBillCheckin({
          creatorChatId: payer?.telegram_chat_id ?? null,
          memberName,
          billTitle: bill.title,
          totalCheckins,
        });
      }
      break;
    }

    case "open_bill_closed": {
      // Notify all participants about bill closure and their share
      const { billId: closedBillId } = payload;

      const { data: bill } = await supabase
        .from("bills")
        .select("title, paid_by")
        .eq("id", closedBillId)
        .single();

      if (bill) {
        const { data: payer } = await supabase
          .from("members")
          .select("display_name")
          .eq("id", bill.paid_by)
          .single();

        const { data: debts } = await supabase
          .from("debts")
          .select("debtor_id, amount")
          .eq("bill_id", closedBillId);

        if (debts && debts.length > 0) {
          const debtorIds = debts.map((d: { debtor_id: string }) => d.debtor_id);
          const { data: debtors } = await supabase
            .from("members")
            .select("id, telegram_chat_id")
            .in("id", debtorIds);

          for (const debtor of debtors ?? []) {
            const debt = debts.find(
              (d: { debtor_id: string; amount: number }) => d.debtor_id === debtor.id
            );
            await notifyOpenBillClosed({
              memberChatId: debtor.telegram_chat_id ?? null,
              billTitle: bill.title,
              perPersonAmount: debt?.amount ?? 0,
              creditorName: payer?.display_name ?? "?",
            });
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
