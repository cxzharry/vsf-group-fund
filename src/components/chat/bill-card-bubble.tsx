// Bill card rendered in the chat feed (closed/standard bills)
import { formatVND } from "@/lib/format-vnd";
import type { Bill, Member } from "@/lib/types";

interface BillCardBubbleProps {
  bill: Bill;
  payer: Member | null;
  participantCount: number;
  currentMemberId: string | null;
}

// Generate consistent avatar color from a string
function avatarColor(name: string): string {
  const colors = [
    "bg-orange-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-yellow-400",
    "bg-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BillCardBubble({
  bill,
  payer,
  participantCount,
  currentMemberId,
}: BillCardBubbleProps) {
  const payerName = payer?.display_name ?? "Ai đó";
  const isMe = payer?.id === currentMemberId;
  const initials = getInitials(payerName);
  const color = avatarColor(payerName);

  const perPerson =
    participantCount > 0 ? Math.floor(bill.total_amount / participantCount) : 0;

  return (
    <div className="mx-4 my-1">
      <div className="rounded-[14px] bg-white p-3 shadow-sm">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">
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

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-400">
            {participantCount} người · {formatVND(perPerson)}đ/người
          </p>
          {bill.status === "closed" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              Đã đóng
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
