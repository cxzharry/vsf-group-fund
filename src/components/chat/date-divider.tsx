// Date separator between messages grouped by day
interface DateDividerProps {
  date: string; // formatted date string, e.g. "28 tháng 1, 2026"
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-gray-200/70 px-3 py-0.5 text-xs text-gray-500">
        {date}
      </span>
    </div>
  );
}
