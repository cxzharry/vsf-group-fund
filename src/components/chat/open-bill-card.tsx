// Open bill card with check-in CTA (bill_type = "open", status = "active")
import { formatVND } from "@/lib/format-vnd";
import type { Bill, Member } from "@/lib/types";

interface OpenBillCardProps {
  bill: Bill;
  payer: Member | null;
  checkinCount: number;
  hasCheckedIn: boolean;
  onCheckin: (billId: string) => void;
  currentMemberId: string | null;
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
  checkinCount,
  hasCheckedIn,
  onCheckin,
  currentMemberId,
}: OpenBillCardProps) {
  const payerName = payer?.display_name ?? "Ai đó";
  const isMe = payer?.id === currentMemberId;
  const initials = getInitials(payerName);

  return (
    <div className="mx-4 my-1">
      <div className="rounded-[14px] bg-[#FFF8EC] p-3 shadow-sm border border-orange-100">
        {/* Badge */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[10px] font-semibold text-white">
            Bill mở
          </span>
          <span className="text-[10px] text-orange-500">
            {checkinCount} người đã check-in
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-orange-300 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-orange-600">
              {isMe ? "Bạn" : payerName} đã tạo
            </p>
            <p className="truncate text-sm font-semibold text-gray-900">
              {bill.title}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-900">
              {formatVND(bill.total_amount)}đ
            </p>
          </div>
        </div>

        {/* Check-in button */}
        {!hasCheckedIn ? (
          <button
            type="button"
            onClick={() => onCheckin(bill.id)}
            className="w-full rounded-xl bg-orange-400 py-2 text-sm font-semibold text-white transition-opacity active:opacity-80"
          >
            Tôi có ăn
          </button>
        ) : (
          <div className="w-full rounded-xl bg-green-50 py-2 text-center text-sm font-semibold text-green-600 border border-green-200">
            Đã check-in
          </div>
        )}
      </div>
    </div>
  );
}
