/**
 * Validação de Inputs
 * 
 * Descrição: Funções utilitárias para validar e sanitizar dados do usuário.
 * Previne injeção de código e dados maliciosos.
 * 
 * Uso:
 * ```typescript
 * const errors = validateAppointment({ name, phone, date });
 * if (Object.keys(errors).length > 0) {
 *   Alert.alert('Erro', Object.values(errors).join('\n'));
 *   return;
 * }
 * ```
 */

/**
 * Remove caracteres especiais perigosos de uma string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>{}()\[\]\\\/]/g, '') // Remove tags HTML e caracteres especiais
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers inline
    .trim();
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  return clean.length >= 10 && clean.length <= 11;
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false; // Todos iguais
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(clean[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(clean[10])) return false;
  
  return true;
}

/**
 * Valida dados de agendamento
 */
export function validateAppointment(data: {
  clientName?: string;
  clientPhone?: string;
  serviceId?: string;
  barberId?: string;
  date?: string;
  time?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.clientName || data.clientName.trim().length < 2) {
    errors.clientName = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.clientName && data.clientName.length > 100) {
    errors.clientName = 'Nome muito longo (máx. 100 caracteres)';
  }

  if (data.clientPhone && !validatePhone(data.clientPhone)) {
    errors.clientPhone = 'Telefone inválido';
  }

  if (!data.serviceId) {
    errors.serviceId = 'Selecione um serviço';
  }

  if (!data.barberId) {
    errors.barberId = 'Selecione um barbeiro';
  }

  if (!data.date) {
    errors.date = 'Selecione uma data';
  }

  if (!data.time) {
    errors.time = 'Selecione um horário';
  }

  return errors;
}

/**
 * Valida dados de cadastro
 */
export function validateRegistration(data: {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Email inválido';
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Telefone inválido';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres';
  }

  return errors;
}

/**
 * Limita tamanho de string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
  }
  return phone;
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
  }
  return cpf;
}
