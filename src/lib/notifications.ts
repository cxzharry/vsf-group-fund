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

/** Notify creditor: debtor claims they paid */
export async function notifyPaymentClaim(params: {
  creditorChatId: string | null;
  debtorName: string;
  amount: number;
  method: string;
}) {
  const methodText =
    params.method === "screenshot_ocr" ? "(có ảnh xác nhận)" : "(chưa có ảnh)";
  await notifyMember(
    params.creditorChatId,
    `💰 <b>${params.debtorName}</b> báo đã chuyển ${formatVND(params.amount)}đ cho bạn ${methodText}\n` +
      `Vào app để xác nhận.`
  );
}

/** Notify debtor: creditor confirmed payment */
export async function notifyPaymentConfirmed(params: {
  debtorChatId: string | null;
  creditorName: string;
  amount: number;
}) {
  await notifyMember(
    params.debtorChatId,
    `✅ <b>${params.creditorName}</b> đã xác nhận nhận ${formatVND(params.amount)}đ từ bạn. Khoản nợ đã đóng!`
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
