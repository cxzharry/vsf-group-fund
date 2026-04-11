// AI follow-up question card — shown when AI needs more info to create a bill
import type { FollowUpQuestion } from "@/lib/ai-intent-types";

interface AiFollowupCardProps {
  followUp: FollowUpQuestion;
  onSelectOption: (value: string, label: string) => void;
}

export function AiFollowupCard({ followUp, onSelectOption }: AiFollowupCardProps) {
  return (
    <div className="mx-4 my-1 flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
        {/* Bot label */}
        <p className="mb-1.5 text-[10px] font-semibold text-[#3A5CCC]">AI trợ lý</p>

        {/* Question */}
        <p className="mb-2.5 text-sm text-gray-900">{followUp.question}</p>

        {/* Options */}
        <div className="flex flex-col gap-1.5">
          {followUp.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelectOption(opt.value, opt.label)}
              className="flex items-start gap-2 rounded-xl border border-[#3A5CCC]/20 bg-[#F0F4FF] px-3 py-2 text-left transition-colors active:bg-[#3A5CCC]/10"
            >
              <span className="min-w-[18px] text-xs font-bold text-[#3A5CCC]">
                {opt.label.charAt(0).toUpperCase()}.
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900">{opt.label}</p>
                {opt.description && (
                  <p className="text-[10px] text-gray-400">{opt.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Hint */}
        <p className="mt-2 text-[10px] text-gray-400">Chọn option hoặc chat tiếp</p>
      </div>
    </div>
  );
}
