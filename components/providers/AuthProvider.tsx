"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: (redirectTo?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      }
    });

    // 2. Real-time auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Only refresh server components on genuine sign-in / sign-out events.
        // Avoid refreshing on INITIAL_SESSION or TOKEN_REFRESHED to eliminate
        // duplicate server re-renders and redundant database queries on navigation.
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          startTransition(() => {
            router.refresh();
          });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const refreshUser = async () => {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
  };

  const signOut = async (redirectTo: string = "/") => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
