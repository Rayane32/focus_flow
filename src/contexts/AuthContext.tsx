/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  // Load user session
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Real Supabase session management
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode via LocalStorage
      const storedSession = localStorage.getItem('focusflow_session');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem('focusflow_session');
        }
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      if (isSupabaseConfigured) {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
        }
        return { error: null };
      } else {
        // Mock authentication
        const usersJson = localStorage.getItem('focusflow_mock_users') || '[]';
        const users = JSON.parse(usersJson) as Array<{ id: string; email: string; password: string }>;
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!found) {
          throw new Error('E-mail ou senha incorretos.');
        }

        if (found.password !== password) {
          throw new Error('E-mail ou senha incorretos.');
        }

        const sessionUser = { id: found.id, email: found.email };
        localStorage.setItem('focusflow_session', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { error: null };
      }
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      if (isSupabaseConfigured) {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // In some configuration, email confirmation is required. Just advise them.
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
        }
        return { error: null };
      } else {
        // Mock authentication signup
        const usersJson = localStorage.getItem('focusflow_mock_users') || '[]';
        const users = JSON.parse(usersJson) as Array<{ id: string; email: string; password: string }>;
        
        const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          throw new Error('Este e-mail já está cadastrado.');
        }

        const newUser = {
          id: Math.random().toString(36).substring(2, 11),
          email,
          password
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('focusflow_mock_users', JSON.stringify(updatedUsers));

        const sessionUser = { id: newUser.id, email: newUser.email };
        localStorage.setItem('focusflow_session', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { error: null };
      }
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        return { error: null };
      } else {
        localStorage.removeItem('focusflow_session');
        setUser(null);
        return { error: null };
      }
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        return { error: null };
      } else {
        // Mock password reset
        const usersJson = localStorage.getItem('focusflow_mock_users') || '[]';
        const users = JSON.parse(usersJson) as Array<{ id: string; email: string }>;
        const found = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          throw new Error('E-mail não encontrado no sistema.');
        }
        return { error: null };
      }
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
