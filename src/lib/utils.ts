import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAdCoverImage(images: any[] | undefined | null): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  // prioridade 1: imagem destaque
  const primary = images.find(img => img?.is_primary === true);

  // prioridade 2: menor sort_order
  const sorted = [...images].sort((a, b) => {
    const orderA = typeof a?.sort_order === "number" ? a.sort_order : 999;
    const orderB = typeof b?.sort_order === "number" ? b.sort_order : 999;
    return orderA - orderB;
  });

  console.log("getAdCoverImage images:", images);
  console.log("primary image:", primary);
  console.log("selected cover:", primary?.image_url || sorted[0]?.image_url || images[0]?.image_url);

  if (primary?.image_url) return primary.image_url;
  if (sorted[0]?.image_url) return sorted[0].image_url;

  // fallback final
  return images[0]?.image_url ?? null;
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
