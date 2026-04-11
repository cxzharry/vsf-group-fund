import { AuthProvider } from "@/components/auth-provider";
import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Desktop: center phone-like container with shadow */}
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-[#F2F2F7] shadow-[0_0_40px_rgba(0,0,0,0.12)]">
        <div className="pb-16">
          {children}
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
