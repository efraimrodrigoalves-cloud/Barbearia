/**
 * Hook useOffline - Gerenciamento de Estado Offline
 * 
 * Descrição: Hook global para gerenciar conectividade e cache offline.
 * Fornece status de conexão, dados em cache e funções de sync.
 * 
 * Logs: [OFFLINE]
 * 
 * Uso:
 * ```typescript
 * const { isOnline, isSyncing, offlineData, refreshFromCache } = useOffline();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { cacheGet, cacheSet, CACHE_TTL } from './cache';

const LOG_PREFIX = '[OFFLINE]';

interface OfflineData {
  services: any[];
  barbers: any[];
  appointments: any[];
  profile: any | null;
}

interface UseOfflineReturn {
  isOnline: boolean;
  isSyncing: boolean;
  offlineData: OfflineData;
  refreshFromCache: () => Promise<void>;
  syncToServer: () => Promise<void>;
  getServices: () => Promise<any[]>;
  getBarbers: () => Promise<any[]>;
  getAppointments: () => Promise<any[]>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    services: [],
    barbers: [],
    appointments: [],
    profile: null,
  });

  // Monitorar conectividade
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(connected ?? false);
      
      if (connected) {
        console.log(`${LOG_PREFIX} Conexão restaurada, sincronizando...`);
        syncToServer();
      } else {
        console.log(`${LOG_PREFIX} Sem conexão, carregando cache...`);
        refreshFromCache();
      }
    });

    return () => unsubscribe();
  }, []);

  // Carregar dados do cache ao iniciar
  useEffect(() => {
    refreshFromCache();
  }, []);

  /**
   * Recarrega dados do cache local
   */
  const refreshFromCache = useCallback(async () => {
    console.log(`${LOG_PREFIX} Recarregando dados do cache`);
    
    const [services, barbers, appointments, profile] = await Promise.all([
      cacheGet<any[]>('services') || Promise.resolve([]),
      cacheGet<any[]>('barbers') || Promise.resolve([]),
      cacheGet<any[]>('appointments') || Promise.resolve([]),
      cacheGet<any>('userProfile') || Promise.resolve(null),
    ]);

    setOfflineData({ 
      services: services || [], 
      barbers: barbers || [], 
      appointments: appointments || [], 
      profile: profile || null 
    });
  }, []);

  /**
   * Sincroniza dados locais com o servidor
   */
  const syncToServer = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    console.log(`${LOG_PREFIX} Iniciando sincronização com servidor`);

    try {
      // Buscar dados atualizados do servidor
      const [servicesResult, barbersResult, userResult] = await Promise.all([
        supabase.from('services').select('*'),
        supabase.from('barbers').select('*'),
        supabase.auth.getUser(),
      ]);

      if (servicesResult.data) {
        await cacheSet('services', servicesResult.data, CACHE_TTL.services);
        setOfflineData(prev => ({ ...prev, services: servicesResult.data! }));
        console.log(`${LOG_PREFIX} Serviços sincronizados:`, servicesResult.data.length);
      }

      if (barbersResult.data) {
        await cacheSet('barbers', barbersResult.data, CACHE_TTL.barbers);
        setOfflineData(prev => ({ ...prev, barbers: barbersResult.data! }));
        console.log(`${LOG_PREFIX} Barbeiros sincronizados:`, barbersResult.data.length);
      }

      if (userResult.data?.user) {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*, services(name), barbers(name)')
          .eq('user_id', userResult.data.user.id)
          .order('appointment_date', { ascending: false });

        if (appointments) {
          await cacheSet('appointments', appointments, CACHE_TTL.appointments);
          setOfflineData(prev => ({ ...prev, appointments }));
          console.log(`${LOG_PREFIX} Agendamentos sincronizados:`, appointments.length);
        }
      }

      console.log(`${LOG_PREFIX} Sincronização concluída`);
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro na sincronização:`, error.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  /**
   * Busca serviços (cache ou servidor)
   */
  const getServices = useCallback(async (): Promise<any[]> => {
    if (isOnline) {
      const { data } = await supabase.from('services').select('*');
      if (data) {
        await cacheSet('services', data, CACHE_TTL.services);
        return data;
      }
    }
    const cached = await cacheGet<any[]>('services');
    return cached || [];
  }, [isOnline]);

  /**
   * Busca barbeiros (cache ou servidor)
   */
  const getBarbers = useCallback(async (): Promise<any[]> => {
    if (isOnline) {
      const { data } = await supabase.from('barbers').select('*');
      if (data) {
        await cacheSet('barbers', data, CACHE_TTL.barbers);
        return data;
      }
    }
    const cached = await cacheGet<any[]>('barbers');
    return cached || [];
  }, [isOnline]);

  /**
   * Busca agendamentos (cache ou servidor)
   */
  const getAppointments = useCallback(async (): Promise<any[]> => {
    if (isOnline) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('appointments')
          .select('*, services(name), barbers(name)')
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: false });
        
        if (data) {
          await cacheSet('appointments', data, CACHE_TTL.appointments);
          return data;
        }
      }
    }
    const cached = await cacheGet<any[]>('appointments');
    return cached || [];
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    offlineData,
    refreshFromCache,
    syncToServer,
    getServices,
    getBarbers,
    getAppointments,
  };
}
