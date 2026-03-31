/**
 * Cache com TTL (Time To Live)
 * 
 * Descrição: Sistema de cache local com expiração automática.
 * Usa AsyncStorage para persistência e TTL para invalidação.
 * 
 * Logs: [CACHE]
 * 
 * Uso:
 * ```typescript
 * // Salvar no cache (5 minutos)
 * await cacheSet('services', services, 5 * 60 * 1000);
 * 
 * // Recuperar do cache
 * const cached = await cacheGet('services');
 * if (cached) {
 *   setData(cached);
 * } else {
 *   // Buscar do servidor
 * }
 * 
 * // Remover do cache
 * await cacheDelete('services');
 * 
 * // Limpar todo o cache
 * await cacheClear();
 * ```
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_PREFIX = '[CACHE]';

/**
 * Estrutura de um item no cache
 */
interface CacheItem<T> {
  data: T;
  expires: number;
  createdAt: number;
}

/**
 * Salva dados no cache com TTL
 * 
 * @param key - Chave única para o cache
 * @param data - Dados a serem armazenados
 * @param ttl - Tempo de vida em milissegundos (padrão: 5 minutos)
 * 
 * Logs: [CACHE]
 */
export async function cacheSet<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
  try {
    const item: CacheItem<T> = {
      data,
      expires: Date.now() + ttl,
      createdAt: Date.now(),
    };

    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(item));
    console.log(`${LOG_PREFIX} Dados salvos:`, { key, ttl: `${ttl / 1000}s` });
  } catch (error: any) {
    console.log(`${LOG_PREFIX} Erro ao salvar cache:`, { key, error: error.message });
  }
}

/**
 * Recupera dados do cache
 * 
 * @param key - Chave do cache
 * @returns Dados armazenados ou null (se expirado ou não encontrado)
 * 
 * Logs: [CACHE]
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`);
    
    if (!raw) {
      console.log(`${LOG_PREFIX} Cache miss:`, { key });
      return null;
    }

    const item: CacheItem<T> = JSON.parse(raw);

    // Verificar se expirou
    if (Date.now() > item.expires) {
      console.log(`${LOG_PREFIX} Cache expirado, removendo:`, { key });
      await AsyncStorage.removeItem(`cache:${key}`);
      return null;
    }

    const age = Date.now() - item.createdAt;
    console.log(`${LOG_PREFIX} Cache hit:`, { key, age: `${age / 1000}s` });
    return item.data;
  } catch (error: any) {
    console.log(`${LOG_PREFIX} Erro ao recuperar cache:`, { key, error: error.message });
    return null;
  }
}

/**
 * Remove um item do cache
 * 
 * @param key - Chave do cache
 * 
 * Logs: [CACHE]
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`cache:${key}`);
    console.log(`${LOG_PREFIX} Cache removido:`, { key });
  } catch (error: any) {
    console.log(`${LOG_PREFIX} Erro ao remover cache:`, { key, error: error.message });
  }
}

/**
 * Limpa todo o cache
 * 
 * Logs: [CACHE]
 */
export async function cacheClear(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache:'));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`${LOG_PREFIX} Cache limpo:`, { count: cacheKeys.length });
    }
  } catch (error: any) {
    console.log(`${LOG_PREFIX} Erro ao limpar cache:`, error.message);
  }
}

/**
 * Verifica se um item existe no cache (sem verificar expiração)
 * 
 * @param key - Chave do cache
 * @returns true se existe
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`);
    return raw !== null;
  } catch {
    return false;
  }
}

/**
 * Wrapper para buscar dados com fallback de cache
 * 
 * Fluxo:
 * 1. Tenta recuperar do cache
 * 2. Se cache válido, retorna
 * 3. Se cache inválido, executa fetchFn
 * 4. Salva resultado no cache
 * 5. Retorna dados
 * 
 * @param key - Chave do cache
 * @param fetchFn - Função async para buscar dados do servidor
 * @param ttl - TTL em milissegundos
 * @returns Dados do cache ou do servidor
 * 
 * Logs: [CACHE]
 */
export async function cacheFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Tentar cache primeiro
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - buscar do servidor
  console.log(`${LOG_PREFIX} Buscando do servidor:`, { key });
  const data = await fetchFn();
  
  // Salvar no cache
  await cacheSet(key, data, ttl);
  
  return data;
}

/**
 * TTLs recomendados para dados do Barbershop App
 */
export const CACHE_TTL = {
  services: 5 * 60 * 1000,           // 5 minutos
  barbers: 5 * 60 * 1000,            // 5 minutos
  availableSlots: 60 * 1000,         // 1 minuto
  userProfile: 10 * 60 * 1000,       // 10 minutos
  appointments: 2 * 60 * 1000,       // 2 minutos
  reviews: 15 * 60 * 1000,           // 15 minutos
  walletBalance: 30 * 1000,          // 30 segundos
  loyaltyPoints: 5 * 60 * 1000,      // 5 minutos
  preferences: 10 * 60 * 1000,       // 10 minutos
  styleCatalog: 30 * 60 * 1000,      // 30 minutos
  gallery: 15 * 60 * 1000,           // 15 minutos
} as const;
