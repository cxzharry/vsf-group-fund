import { AuthProvider } from "@/components/auth-provider";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Mobile: phone-like container; Desktop: full sidebar layout */}
      <div className="min-h-dvh bg-[#E8ECF4] sm:flex sm:items-stretch">
        {/* Desktop sidebar nav */}
        <DesktopNav />

        {/* Main content area */}
        <div className="relative flex-1 sm:flex sm:justify-center">
          {/* Phone frame on desktop for content */}
          <div className="relative w-full bg-[#F2F2F7] sm:max-w-xl sm:shadow-[0_0_60px_rgba(0,0,0,0.15)]">
            {/* On mobile: padding for bottom nav; desktop: no bottom nav */}
            <div className="pb-16 sm:pb-0">
              {children}
            </div>
            {/* Bottom nav only on mobile */}
            <BottomNav />
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
