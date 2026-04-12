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
          <div className="flex min-h-dvh w-full flex-col bg-[#F2F2F7] sm:max-w-xl sm:min-h-0 sm:shadow-[0_0_60px_rgba(0,0,0,0.15)]">
            <div className="flex-1">
              {children}
            </div>
            {/* Bottom nav only on mobile — sticky to bottom of flex container */}
            <BottomNav />
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
