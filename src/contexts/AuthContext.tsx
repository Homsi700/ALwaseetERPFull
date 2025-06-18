
// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // Optional avatar URL
}

interface AuthContextType {
  user: User | null;
  login: (email: string, name?: string, avatar?: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('alwaseetUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string, name: string = 'مستخدم تجريبي', avatar?: string) => {
    // In a real app, ID would come from the backend
    const demoUser: User = { id: new Date().getTime().toString(), email, name, avatar };
    setUser(demoUser);
    localStorage.setItem('alwaseetUser', JSON.stringify(demoUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('alwaseetUser');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

    