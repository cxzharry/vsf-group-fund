import { notifyMember } from "@/lib/telegram-bot";
import { formatVND } from "@/lib/format-vnd";

/** Notify creditor: new bill created, people owe you */
export async function notifyNewBill(params: {
  creditorChatId: string | null;
  billTitle: string;
  totalAmount: number;
  participantCount: number;
}) {
  await notifyMember(
    params.creditorChatId,
    `🧾 <b>Bill mới: ${params.billTitle}</b>\n` +
      `Tổng: ${formatVND(params.totalAmount)}đ\n` +
      `${params.participantCount} người tham gia`
  );
}

/** Notify creditor: debtor settled multiple debts at once (aggregated QR transfer).
 *  One message listing all closed debts — avoids per-bill spam. */
export async function notifyPaymentClaimBatch(params: {
  creditorChatId: string | null;
  debtorName: string;
  totalAmount: number;
  debtCount: number;
  billTitles: string[]; // up to 5; rest truncated
}) {
  const MAX = 5;
  const shownTitles = params.billTitles.slice(0, MAX);
  const extra = params.billTitles.length - shownTitles.length;
  const lines = shownTitles.map((t) => `• ${t}`).join("\n");
  const truncatedTail = extra > 0 ? `\n• … và ${extra} khoản khác` : "";
  await notifyMember(
    params.creditorChatId,
    `✅ <b>${params.debtorName}</b> đã trả ${formatVND(params.totalAmount)}đ (gộp ${params.debtCount} khoản)\n${lines}${truncatedTail}\nTất cả đã đóng.`
  );
}

/** Notify debtor: you have a new debt */
export async function notifyNewDebt(params: {
  debtorChatId: string | null;
  creditorName: string;
  amount: number;
  billTitle: string;
}) {
  await notifyMember(
    params.debtorChatId,
    `📢 Bạn nợ <b>${params.creditorName}</b> ${formatVND(params.amount)}đ\n` +
      `Bill: ${params.billTitle}\n` +
      `Vào app để chuyển khoản.`
  );
}

/** Notify group members: open bill created, they can check in */
export async function notifyOpenBillCreated(params: {
  memberChatId: string | null;
  creatorName: string;
  billTitle: string;
  totalAmount: number;
}) {
  await notifyMember(
    params.memberChatId,
    `🧾 <b>${params.creatorName}</b> tạo bill mở: <b>${params.billTitle}</b>\n` +
      `Tổng: ${formatVND(params.totalAmount)}đ\n` +
      `Vào app để check-in nếu bạn tham gia!`
  );
}

/** Notify bill creator: someone checked in to their open bill */
export async function notifyOpenBillCheckin(params: {
  creatorChatId: string | null;
  memberName: string;
  billTitle: string;
  totalCheckins: number;
}) {
  await notifyMember(
    params.creatorChatId,
    `✅ <b>${params.memberName}</b> đã check-in vào bill "<b>${params.billTitle}</b>"\n` +
      `Hiện có ${params.totalCheckins} người tham gia.`
  );
}

/** Notify all participants: open bill closed, debts created */
export async function notifyOpenBillClosed(params: {
  memberChatId: string | null;
  billTitle: string;
  perPersonAmount: number;
  creditorName: string;
}) {
  await notifyMember(
    params.memberChatId,
    `🔒 Bill "<b>${params.billTitle}</b>" đã đóng.\n` +
      `Mỗi người: ${formatVND(params.perPersonAmount)}đ → chuyển cho <b>${params.creditorName}</b>\n` +
      `Vào app để chuyển khoản.`
  );
}
