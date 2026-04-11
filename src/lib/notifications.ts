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
