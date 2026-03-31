/**
 * AuthContext - Contexto de Autenticação Global
 * 
 * Descrição: Gerencia estado de autenticação em toda a aplicação.
 * Fornece usuário, perfil e funções de auth via Context API.
 * 
 * Tabelas utilizadas: profiles
 * Logs: [AUTH]
 * 
 * Uso:
 * ```typescript
 * // No _layout.tsx (provider)
 * import { AuthProvider } from '../lib/AuthContext';
 * 
 * <AuthProvider>
 *   <Slot />
 * </AuthProvider>
 * 
 * // Em qualquer componente (consumer)
 * import { useAuth } from '../lib/AuthContext';
 * 
 * const { user, profile, loading, signOut } = useAuth();
 * ```
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

const LOG_PREFIX = '[AUTH]';

/**
 * Interface do perfil do usuário
 */
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'barber' | 'client' | null;
  avatar_url: string | null;
  created_at: string;
}

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  /** Sessão atual do Supabase */
  session: Session | null;
  /** Usuário autenticado */
  user: User | null;
  /** Perfil completo do usuário */
  profile: UserProfile | null;
  /** Loading state */
  loading: boolean;
  /** Verificar se é admin */
  isAdmin: boolean;
  /** Verificar se é barbeiro */
  isBarber: boolean;
  /** Verificar se é cliente */
  isClient: boolean;
  /** Fazer logout */
  signOut: () => Promise<void>;
  /** Recarregar perfil do usuário */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticação
 * 
 * Gerencia sessão, usuário e perfil.
 * Escuta mudanças de auth state automaticamente.
 * 
 * Logs: [AUTH]
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega o perfil do usuário do banco de dados
   * 
   * Logs: [AUTH]
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log(`${LOG_PREFIX} Carregando perfil do usuário:`, { userId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log(`${LOG_PREFIX} Erro ao carregar perfil:`, error.message);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
      console.log(`${LOG_PREFIX} Perfil carregado:`, { role: data?.role, name: data?.full_name });
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao carregar perfil:`, error.message);
      setProfile(null);
    }
  }, []);

  /**
   * Recarrega o perfil do usuário (útil após atualizações)
   * 
   * Logs: [AUTH]
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  /**
   * Inicializa autenticação e escuta mudanças de estado
   */
  useEffect(() => {
    console.log(`${LOG_PREFIX} Inicializando AuthProvider`);

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(`${LOG_PREFIX} Sessão verificada:`, { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Escutar mudanças de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`${LOG_PREFIX} Auth state changed:`, { event: _event, hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  /**
   * Faz logout do usuário
   * 
   * Logs: [AUTH]
   */
  const signOut = useCallback(async () => {
    try {
      console.log(`${LOG_PREFIX} Iniciando logout`);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      console.log(`${LOG_PREFIX} Logout realizado com sucesso`);
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao fazer logout:`, error.message);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isBarber: profile?.role === 'barber',
    isClient: profile?.role === 'client',
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar o contexto de autenticação
 * 
 * @returns AuthContextType
 * @throws Error se usado fora do AuthProvider
 * 
 * Uso:
 * ```typescript
 * const { user, profile, isAdmin, signOut } = useAuth();
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}
