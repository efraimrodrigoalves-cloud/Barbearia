/**
 * Error Handler Centralizado
 * 
 * Descrição: Tratamento centralizado de erros do Supabase e da aplicação.
 * Converte erros técnicos em mensagens amigáveis para o usuário.
 * 
 * Logs: [ERRO]
 * 
 * Uso:
 * ```typescript
 * try {
 *   const { data, error } = await supabase.from('appointments').select();
 *   if (error) throw error;
 * } catch (error) {
 *   const message = handleSupabaseError(error, 'Carregar agendamentos');
 *   Alert.alert('Erro', message);
 * }
 * ```
 */

import { Alert } from 'react-native';

/**
 * Mapa de erros conhecidos do Supabase para mensagens amigáveis
 */
const KNOWN_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos. Verifique e tente novamente.',
  'Email not confirmed': 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.',
  'Email rate limit exceeded': 'Muitas tentativas de login. Aguarde alguns minutos.',
  'JWT expired': 'Sua sessão expirou. Faça login novamente.',
  'Invalid JWT': 'Sessão inválida. Faça login novamente.',
  'duplicate key value violates unique constraint': 'Este registro já existe.',
  'violates foreign key constraint': 'Registro relacionado não encontrado.',
  'permission denied': 'Você não tem permissão para esta ação.',
  'new row violates row-level security policy': 'Acesso negado. Verifique suas permissões.',
  'could not find the policy': 'Erro de configuração de segurança.',
  'could not connect to server': 'Sem conexão com o servidor. Verifique sua internet.',
  'Network request failed': 'Sem conexão com a internet. Verifique sua rede.',
  'fetch failed': 'Erro de conexão. Tente novamente.',
  'timeout': 'Tempo esgotado. Verifique sua conexão e tente novamente.',
  'User already registered': 'Este email já está cadastrado. Tente fazer login.',
  'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
  'Invalid email': 'Email inválido. Verifique o formato.',
  'Weak password': 'Senha muito fraca. Use letras, números e caracteres especiais.',
  'Phone number should be valid': 'Número de telefone inválido.',
  'rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
};

/**
 * Mapeia erro do Supabase para mensagem amigável
 * 
 * @param error - Objeto de erro do Supabase ou Error genérico
 * @param context - Contexto da operação (ex: 'Carregar agendamentos')
 * @returns Mensagem amigável para o usuário
 * 
 * Logs: [ERRO]
 */
export function handleSupabaseError(error: any, context: string): string {
  // Log do erro com contexto
  console.log(`[ERRO] ${context}:`, error?.message || error);

  // Error do Supabase
  if (error?.message) {
    for (const [key, message] of Object.entries(KNOWN_ERRORS)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
  }

  // Error genérico
  if (error?.message) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
}

/**
 * Exibe alerta de erro com mensagem amigável
 * 
 * @param error - Objeto de erro
 * @param context - Contexto da operação
 * @param title - Título do alerta (padrão: 'Erro')
 * 
 * Logs: [ERRO]
 */
export function showErrorAlert(error: any, context: string, title: string = 'Erro'): void {
  const message = handleSupabaseError(error, context);
  Alert.alert(title, message);
}

/**
 * Verifica se um erro é de rede/conexão
 * 
 * @param error - Objeto de erro
 * @returns true se for erro de rede
 */
export function isNetworkError(error: any): boolean {
  const networkKeywords = [
    'Network request failed',
    'fetch failed',
    'could not connect to server',
    'timeout',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NAME_NOT_RESOLVED',
  ];

  const message = error?.message || '';
  return networkKeywords.some(keyword => message.includes(keyword));
}

/**
 * Verifica se um erro é de autenticação
 * 
 * @param error - Objeto de erro
 * @returns true se for erro de auth
 */
export function isAuthError(error: any): boolean {
  const authKeywords = [
    'Invalid login credentials',
    'JWT expired',
    'Invalid JWT',
    'Email not confirmed',
    'session',
    'auth',
  ];

  const message = error?.message || '';
  return authKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * Verifica se um erro é de permissão
 * 
 * @param error - Objeto de erro
 * @returns true se for erro de permissão
 */
export function isPermissionError(error: any): boolean {
  const permissionKeywords = [
    'permission denied',
    'row-level security',
    'violates row-level',
    'not authorized',
    'forbidden',
  ];

  const message = error?.message || '';
  return permissionKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * Wrapper para executar operações do Supabase com tratamento de erro
 * 
 * @param operation - Função async que executa a operação
 * @param context - Contexto da operação para logs
 * @param onError - Callback opcional para tratamento customizado
 * @returns Resultado da operação ou null em caso de erro
 * 
 * Logs: [ERRO]
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: string,
  onError?: (error: any) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.log(`[ERRO] Falha em ${context}:`, error?.message || error);
    
    if (onError) {
      onError(error);
    } else {
      showErrorAlert(error, context);
    }
    
    return null;
  }
}
