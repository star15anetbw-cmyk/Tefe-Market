import { supabase } from '../lib/supabase';

export interface AuthError {
  message: string;
}

export function mapAuthError(error: any): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (message.includes('email not confirmed')) return 'Por favor, confirme seu e-mail antes de entrar.';
  if (message.includes('password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('invalid format') || message.includes('invalid email')) return 'Formato de e-mail inválido.';
  if (message.includes('network error')) return 'Erro de conexão. Verifique sua internet.';
  if (message.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.';
  if (message.includes('too many requests')) return 'Servidor sobrecarregado. Tente novamente em instantes.';
  if (message.includes('signup disabled')) return 'O cadastro de novos usuários está temporariamente desativado.';
  
  console.error('Unhandled auth error:', error);
  return 'Ocorreu um erro inesperado. Verifique os dados e tente novamente.';
}

/**
 * @deprecated O perfil agora é criado automaticamente via trigger no banco de dados.
 */
export async function createProfile() {
  console.warn('createProfile manual está obsoleta.');
}
