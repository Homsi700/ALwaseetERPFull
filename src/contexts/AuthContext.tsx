
// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string; 
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, name?: string, avatar?: string) => void; // Kept for potential direct use, but Supabase handles session
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email,
          name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'مستخدم',
          avatar: currentSession.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setUser({
            id: newSession.user.id,
            email: newSession.user.email,
            name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'مستخدم',
            avatar: newSession.user.user_metadata?.avatar_url,
          });
          // Only redirect on explicit SIGNED_IN event if not already on dashboard
          // This prevents redirect loops if user is already on dashboard or other authenticated page
          if (_event === 'SIGNED_IN' && window.location.pathname === '/') {
            router.push('/dashboard');
          }
        } else {
          setUser(null);
           if (_event === 'SIGNED_OUT' && window.location.pathname !== '/') { // Avoid pushing to '/' if already there
            router.push('/');
          }
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [router]);

  const login = (email: string, name: string = 'مستخدم تجريبي', avatar?: string) => {
    console.warn("AuthContext.login called, but Supabase handles actual login. Ensure this is intended.");
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
