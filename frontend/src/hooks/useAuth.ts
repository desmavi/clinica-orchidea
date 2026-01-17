/**
 * Authentication hook using Supabase Magic Link
 * Manages user authentication state and session
 */
import { useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { apiClient } from '@/services/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Handle session changes from Supabase auth
   */
  const handleSessionChange = async (session: Session | null) => {
    if (session) {
      try {
        // Get user data from backend API
        const response = await apiClient.get<User>('/auth/me');

        setAuthState({
          user: response.data,
          supabaseUser: session.user,
          session,
          loading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Session exists but user data fetch failed - still authenticated
        setAuthState({
          user: null,
          supabaseUser: session.user,
          session,
          loading: false,
          isAuthenticated: true,
        });
      }
    } else {
      setAuthState({
        user: null,
        supabaseUser: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  /**
   * Send magic link to user's email
   */
  const sendMagicLink = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(`Errore: ${error.message}`);
        return false;
      }

      toast.success('Magic link inviato! Controlla la tua email.');
      return true;
    } catch (error) {
      console.error('Error sending magic link:', error);
      toast.error('Errore invio del magic link');
      return false;
    }
  };

  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(`Errore nel logout: ${error.message}`);
        return;
      }

      setAuthState({
        user: null,
        supabaseUser: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      });

      toast.success('Logout effettuato con successo');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Errore nel logout');
    }
  };

  /**
   * Refresh user data from backend
   */
  const refreshUser = async () => {
    if (!authState.session) return;

    try {
      const response = await apiClient.get<User>('/auth/me');
      setAuthState((prev) => ({
        ...prev,
        user: response.data,
      }));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin';
  };

  /**
   * Check if user is patient
   */
  const isPatient = (): boolean => {
    return authState.user?.role === 'patient';
  };

  return {
    // State
    user: authState.user,
    supabaseUser: authState.supabaseUser,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,

    // Methods
    sendMagicLink,
    signOut,
    refreshUser,
    isAdmin,
    isPatient,
  };
}