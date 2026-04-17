// Bottom input bar: text field + round blue bill creation button
// The "+" button opens the Bill Confirm Sheet in manual (blank) mode — US-E3-1.
// Typing a message and sending it triggers AI parser — US-E3-2.

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Opens Bill Confirm Sheet with blank state (US-E3-1 manual flow). */
  onOpenManualBill: () => void;
}

export function ChatInputBar({ value, onChange, onSend, onOpenManualBill }: ChatInputBarProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) onSend();
  }

  return (
    <div className="flex items-center gap-2 border-t bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {/* Text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="1tr2 bún bò 6 người..."
        className="h-10 flex-1 rounded-[20px] border border-[#E5E5EA] bg-[#F2F2F7] px-4 text-sm outline-none focus:border-[#3A5CCC] focus:ring-0"
      />

      {/* Manual bill creation button — opens blank Confirm Sheet */}
      <button
        type="button"
        onClick={onOpenManualBill}
        aria-label="Tạo bill thủ công"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3A5CCC] text-white shadow transition-opacity active:opacity-80"
      >
        {/* Plus icon — opens manual bill creation */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
