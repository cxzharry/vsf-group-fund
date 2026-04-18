// AI multi-amount picker — shown when message has 2+ amounts.
// User picks which amount is the bill total (or confirms primary pick).
import { formatVND } from "@/lib/format-vnd";

interface AiMultiAmountCardProps {
  primary: number;
  alternates: number[];
  onSelectAmount: (amount: number) => void;
}

export function AiMultiAmountCard({ primary, alternates, onSelectAmount }: AiMultiAmountCardProps) {
  const all = [primary, ...alternates];
  return (
    <div className="mx-4 my-1 flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
        <p className="mb-1.5 text-[10px] font-semibold text-[#3A5CCC]">AI trợ lý</p>
        <p className="mb-2.5 text-sm text-[#1C1C1E]">
          Thấy nhiều số tiền. Tổng bill là bao nhiêu?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {all.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onSelectAmount(amt)}
              className="rounded-full border border-[#3A5CCC]/20 bg-[#F0F4FF] px-3 py-1.5 text-xs font-semibold text-[#3A5CCC] active:bg-[#3A5CCC]/10"
            >
              {formatVND(amt)}đ
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[#AEAEB2]">Hoặc gõ lại số đúng</p>
      </div>
    </div>
  );
}
