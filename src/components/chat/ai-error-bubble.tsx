// AI error bubble — shown when /api/ai/parse-intent fails (network, rate-limit, server).
// Offers fallback CTA: open manual bill sheet (US-E3-1) OR retry.

interface AiErrorBubbleProps {
  kind?: "network" | "rate_limit" | "server";
  onRetry: () => void;
  onManualFallback: () => void;
}

function messageFor(kind: AiErrorBubbleProps["kind"]): string {
  if (kind === "rate_limit") return "Quá nhiều yêu cầu. Thử lại sau một chút nhé.";
  if (kind === "network") return "Không có mạng. Bạn có thể tạo bill thủ công.";
  return "AI đang bận. Thử lại hoặc tạo bill thủ công.";
}

export function AiErrorBubble({ kind = "server", onRetry, onManualFallback }: AiErrorBubbleProps) {
  return (
    <div className="mx-4 my-1 flex justify-start" role="alert">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
        <p className="mb-1.5 text-[10px] font-semibold text-[#FF3B30]">AI trợ lý</p>
        <p className="mb-2.5 text-sm text-[#1C1C1E]">{messageFor(kind)}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 rounded-xl border border-[#3A5CCC] bg-white py-2 text-sm font-semibold text-[#3A5CCC] active:bg-[#EEF2FF]"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={onManualFallback}
            className="flex-1 rounded-xl bg-[#3A5CCC] py-2 text-sm font-semibold text-white active:opacity-80"
          >
            Tạo thủ công
          </button>
        </div>
      </div>
    </div>
  );
}
