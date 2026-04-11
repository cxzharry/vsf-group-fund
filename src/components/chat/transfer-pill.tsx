// Centered pill showing a completed transfer between two people
interface TransferPillProps {
  fromName: string;
  toName: string;
  amount: number; // in VND integer
}

import { formatVND } from "@/lib/format-vnd";

export function TransferPill({ fromName, toName, amount }: TransferPillProps) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="rounded-full bg-[#3A5CCC] px-4 py-1.5 text-xs text-white">
        ↔ {fromName} đã chuyển {formatVND(amount)}đ cho {toName}
      </div>
    </div>
  );
}
