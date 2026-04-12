"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Nhóm",
    icon: PeopleIcon,
    matchFn: (p: string) => p === "/" || p.startsWith("/groups"),
  },
  {
    href: "/bills",
    label: "Hóa đơn",
    icon: ReceiptIcon,
    matchFn: (p: string) => p.startsWith("/bills"),
  },
  {
    href: "/debts",
    label: "Khoản nợ",
    icon: WalletIcon,
    matchFn: (p: string) => p.startsWith("/debts") || p.startsWith("/transfer"),
  },
  {
    href: "/account",
    label: "Tài khoản",
    icon: PersonIcon,
    matchFn: (p: string) => p.startsWith("/account"),
  },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex sm:w-64 sm:flex-col sm:border-r sm:border-[#E5E5EA] sm:bg-white">
      {/* Logo / Brand */}
      <div className="flex h-[64px] items-center gap-3 px-6 border-b border-[#E5E5EA]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3A5CCC]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <span className="text-[17px] font-bold text-[#1C1C1E]">Group Fund</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => {
          const isActive = item.matchFn(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                isActive
                  ? "bg-[#EEF2FF] text-[#3A5CCC]"
                  : "text-[#3C3C43] hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
              )}
            >
              <item.icon active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-6 py-4 text-xs text-[#AEAEB2]">
        VSF Group Fund v1.0
      </div>
    </aside>
  );
}

function PeopleIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ReceiptIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function WalletIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function PersonIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
