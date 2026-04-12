"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  /** Show back arrow. Defaults to true. */
  showBack?: boolean;
  /** Override back destination instead of router.back() */
  backHref?: string;
  /** Optional right-side element */
  right?: React.ReactNode;
}

/**
 * Consistent iOS-style page header with optional back button.
 * Used on all sub-pages: bills, debts, account, etc.
 */
export function PageHeader({
  title,
  showBack = true,
  backHref,
  right,
}: PageHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }

  return (
    <header className="flex h-[52px] shrink-0 items-center bg-white px-4 shadow-sm">
      {/* Back button — min 44px touch target */}
      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#3A5CCC] transition-colors hover:bg-[#F2F2F7] active:bg-[#E5E5EA]"
          aria-label="Quay lại"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      ) : (
        /* Spacer to keep title centered when no back button */
        <div className="h-11 w-11" />
      )}

      <h1 className="flex-1 text-center text-[17px] font-semibold text-[#1C1C1E]">
        {title}
      </h1>

      {/* Right slot — same width as back button for centering */}
      <div className="flex h-11 w-11 items-center justify-center">
        {right ?? null}
      </div>
    </header>
  );
}
