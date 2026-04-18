// AI processing bubble — typing dots shown while /api/ai/parse-intent is in flight.
// Matches AI trợ lý bubble style from ai-response-card.tsx.

export function AiProcessingBubble() {
  return (
    <div className="mx-4 my-1 flex justify-start" role="status" aria-live="polite">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
        <p className="mb-1.5 text-[10px] font-semibold text-[#3A5CCC]">AI trợ lý</p>
        <div className="flex items-center gap-1.5" aria-label="Đang phân tích tin nhắn">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#3A5CCC]/60 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#3A5CCC]/60 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#3A5CCC]/60" />
          <span className="ml-2 text-[11px] text-[#8E8E93]">Đang đọc tin nhắn...</span>
        </div>
      </div>
    </div>
  );
}
