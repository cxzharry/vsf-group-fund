// AI response card — shown in chat feed when AI has parsed enough info for a bill
import { formatVND } from "@/lib/format-vnd";
import type { ParsedBillIntent } from "@/lib/ai-intent-types";

interface AiResponseCardProps {
  intent: ParsedBillIntent;
  onConfirm: () => void;
  onEdit: () => void;
}

function splitTypeLabel(splitType: ParsedBillIntent["splitType"]): string {
  if (splitType === "equal") return "Chia đều";
  if (splitType === "custom") return "Tuỳ chỉnh";
  if (splitType === "open") return "Bill mở";
  return "Chia đều";
}

function intentTypeLabel(intentType: ParsedBillIntent["intentType"]): string {
  if (intentType === "transfer") return "💸 Chuyển tiền";
  return "🧾 Chia tiền";
}

export function AiResponseCard({ intent, onConfirm, onEdit }: AiResponseCardProps) {
  const perPerson =
    intent.amount && intent.peopleCount && intent.peopleCount > 0
      ? Math.floor(intent.amount / intent.peopleCount)
      : null;
  const lowConfidence = typeof intent.confidence === "number" && intent.confidence < 0.6;

  return (
    <div className="mx-4 my-1 flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
        {/* Bot label */}
        <p className="mb-1.5 text-[10px] font-semibold text-[#3A5CCC]">AI trợ lý</p>

        {/* Intent type chip */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="rounded-full bg-[#3A5CCC]/10 px-2 py-0.5 text-[11px] font-semibold text-[#3A5CCC]">
            {intentTypeLabel(intent.intentType)}
          </span>
          {intent.splitType && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {splitTypeLabel(intent.splitType)}
            </span>
          )}
          {lowConfidence && (
            <span
              className="rounded-full bg-[#FFF8EC] px-2 py-0.5 text-[11px] font-semibold text-[#FF9500]"
              title="AI không chắc lắm — hãy kiểm tra lại"
            >
              ⚠ Cần xem lại
            </span>
          )}
        </div>

        {/* Parsed details */}
        <div className="mb-3 space-y-1">
          {intent.description && (
            <p className="text-sm font-semibold text-foreground">{intent.description}</p>
          )}
          {intent.amount && (
            <p className="text-sm text-muted-foreground">
              Tổng:{" "}
              <span className="font-bold text-foreground">{formatVND(intent.amount)}đ</span>
            </p>
          )}
          {intent.peopleCount && (
            <p className="text-sm text-muted-foreground">
              {intent.peopleCount} người
              {perPerson ? ` · ${formatVND(perPerson)}đ/người` : ""}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#3A5CCC] py-2 text-sm font-semibold text-white transition-opacity active:opacity-80"
          >
            Tạo bill
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors active:bg-muted/80"
          >
            Sửa
          </button>
        </div>
      </div>
    </div>
  );
}
