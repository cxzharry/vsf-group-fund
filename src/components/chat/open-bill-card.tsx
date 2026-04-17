// Open bill card with check-in CTA (bill_type = "open", status = "active")
// Enhanced: member list, add people link, close bill link
import { formatVND } from "@/lib/format-vnd";
import type { Bill, Member, BillCheckin } from "@/lib/types";

interface OpenBillCardProps {
  bill: Bill;
  payer: Member | null;
  checkins: BillCheckin[];
  memberMap: Record<string, Member>;
  hasCheckedIn: boolean;
  onCheckin: (billId: string) => void;
  onAddPeople: (billId: string) => void;
  onCloseBill: (billId: string) => void;
  currentMemberId: string | null;
  isPayerOrAdmin: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OpenBillCard({
  bill,
  payer,
  checkins,
  memberMap,
  hasCheckedIn,
  onCheckin,
  onAddPeople,
  onCloseBill,
  currentMemberId,
  isPayerOrAdmin,
}: OpenBillCardProps) {
  const payerName = payer?.display_name ?? "Ai đó";
  const isMe = payer?.id === currentMemberId;
  const initials = getInitials(payerName);
  const checkinCount = checkins.length;

  return (
    <div className="mx-4 my-1">
      {/* Card: rounded-[14px] per tokens.radius.card, p-4 per Card anatomy */}
      <div className="rounded-[14px] bg-[#FFF8EC] p-4 shadow-sm border border-[#FFE0B2]">
        {/* Badge */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-[#FF9500] px-2 py-0.5 text-[10px] font-semibold text-white">
            Bill mở
          </span>
          <span className="text-[10px] text-[#FF9500]">
            {checkinCount} người đã check-in
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#FFB74D] text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#FF9500]">
              {isMe ? "Bạn" : payerName} đã tạo
            </p>
            <p className="truncate text-sm font-semibold text-[#1C1C1E]">
              {bill.title}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#1C1C1E]">
              {formatVND(bill.total_amount)}đ
            </p>
          </div>
        </div>

        {/* Checked-in member list */}
        {checkinCount > 0 && (
          <div className="mb-2 space-y-1">
            {checkins.slice(0, 5).map((c) => {
              const m = c.member_id ? memberMap[c.member_id] : null;
              const name = m?.display_name ?? c.guest_name ?? "Khách";
              const isGuest = !c.member_id;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFE0B2] text-[9px] font-bold text-[#E65100]">
                    {getInitials(name)}
                  </div>
                  <p className="text-xs text-[#636366]">{name}</p>
                  {isGuest && (
                    <span className="text-[9px] text-[#AEAEB2]">• Khách</span>
                  )}
                </div>
              );
            })}
            {checkinCount > 5 && (
              <p className="text-[10px] text-[#AEAEB2]">
                +{checkinCount - 5} người khác
              </p>
            )}
          </div>
        )}

        {/* Check-in button — CTA: rounded-[14px] h-[54px] full-width per Button.lg spec */}
        {!hasCheckedIn ? (
          <button
            type="button"
            onClick={() => onCheckin(bill.id)}
            className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#FF9500] text-[17px] font-semibold text-white transition-opacity active:scale-[0.98]"
          >
            Tôi có ăn
          </button>
        ) : (
          <div className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#F0FFF4] text-[17px] font-semibold text-[#34C759] border border-[#34C759]/30">
            Đã check-in
          </div>
        )}

        {/* Secondary actions */}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onAddPeople(bill.id)}
            className="text-xs font-medium text-[#FF9500] underline-offset-2 hover:underline"
          >
            + Thêm người
          </button>

          {isPayerOrAdmin && (
            <button
              type="button"
              onClick={() => onCloseBill(bill.id)}
              className="text-xs font-medium text-[#AEAEB2] underline-offset-2 hover:underline"
            >
              Đóng bill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
