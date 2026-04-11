// Bottom input bar: text field + round blue bill creation button
import { useRouter } from "next/navigation";

interface ChatInputBarProps {
  groupId: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatInputBar({ groupId, value, onChange, onSend }: ChatInputBarProps) {
  const router = useRouter();

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
        className="h-10 flex-1 rounded-[20px] border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-300 focus:ring-0"
      />

      {/* Bill creation button — round blue */}
      <button
        type="button"
        onClick={() => router.push(`/bills/new?group=${groupId}`)}
        aria-label="Tạo bill"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A5CCC] text-white shadow transition-opacity active:opacity-80"
      >
        {/* Receipt icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M14 8H8M16 12H8M11 16H8" />
        </svg>
      </button>
    </div>
  );
}
