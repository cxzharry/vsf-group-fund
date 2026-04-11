"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { Member } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  member: Member | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    let mounted = true;

    async function fetchOrCreateMember(user: User) {
      // Try to find existing member
      let { data } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Auto-create member if trigger didn't fire
      if (!data) {
        const { data: created } = await supabase
          .from("members")
          .insert({
            user_id: user.id,
            display_name:
              user.user_metadata?.full_name ??
              user.email?.split("@")[0] ??
              "User",
            email: user.email ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
          })
          .select()
          .single();
        data = created;
      }

      if (mounted) {
        setMember(data);
        setLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setUser(user);
      if (user) fetchOrCreateMember(user);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchOrCreateMember(currentUser);
      else {
        setMember(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setMember(null);
  }

  return (
    <AuthContext.Provider value={{ user, member, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
