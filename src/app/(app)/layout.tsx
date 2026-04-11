import { AuthProvider } from "@/components/auth-provider";
import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="mx-auto min-h-dvh max-w-md pb-16">
        {children}
      </div>
      <BottomNav />
    </AuthProvider>
  );
}
