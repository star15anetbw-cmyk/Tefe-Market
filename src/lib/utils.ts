import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function formatAdPrice(price: number, adType: string) {
  if (adType === 'service' && (price === 0 || !price)) {
    return 'Preço a combinar';
  }
  return formatPrice(price);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function isNonCriticalSupabaseError(error: any): boolean {
  if (!error) return false;
  const message = error.message || String(error);
  return (
    message.includes('AbortError') ||
    message.includes('Lock') ||
    message.includes('stole it') ||
    message.includes('auth-token') ||
    message.includes('session') ||
    message.includes('NavigatorLockAcquireTimeoutError')
  );
}
