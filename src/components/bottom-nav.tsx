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
    href: "/account",
    label: "Tài khoản",
    icon: PersonIcon,
    matchFn: (p: string) => p.startsWith("/account"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    // Hidden on desktop — desktop uses sidebar nav instead
    <nav
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-[#E5E5EA] bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      style={{ height: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex h-14 items-stretch justify-around">
        {navItems.map((item) => {
          const isActive = item.matchFn(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive ? "text-[#3A5CCC]" : "text-[#8E8E93]"
              )}
            >
              <item.icon active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function PeopleIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function PersonIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
