"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { MobileHeader } from "@/components/mobile-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/lib/types";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("members")
        .select("*")
        .order("display_name");
      setMembers(data ?? []);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <MobileHeader title="Thành viên" />
      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const initials = m.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.email}
                    </p>
                  </div>
                  {m.bank_name ? (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {m.bank_name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Chưa có TK
                    </Badge>
                  )}
                </div>
              );
            })}
            {members.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Chưa có thành viên nào
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
