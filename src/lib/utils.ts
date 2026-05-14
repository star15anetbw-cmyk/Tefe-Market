import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FALLBACK_IMAGE } from '../constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, context?: string) {
  const target = e.target as HTMLImageElement;
  // @ts-ignore - import.meta.env is a Vite-specific property
  if (import.meta.env.DEV) {
    console.warn(`[Image Error] Failed to load image${context ? ` for ${context}` : ''}:`, target.src);
  }
  // Prevent infinite loop if fallback also fails
  if (target.src !== FALLBACK_IMAGE) {
    target.src = FALLBACK_IMAGE;
  }
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
  if (price === 0 || !price) {
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
    message.includes('NavigatorLockAcquireTimeoutError') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('invalid_refresh_token')
  );
}

/**
 * Embaralhamento inteligente para anúncios.
 * Considera aleatoriedade, recência e penalidade por muitas visualizações.
 */
export function smartShuffle<T extends { created_at?: string; views?: number }>(items: T[]): T[] {
  if (!items.length) return [];
  
  const scoredItems = items.map(item => {
    // Fator aleatório (0 a 2)
    const randomFactor = Math.random() * 2;
    
    // Boost de recência (até 1.5)
    // Anúncios novos (últimos 7 dias) ganham mais destaque
    const date = item.created_at ? new Date(item.created_at).getTime() : Date.now();
    const ageInDays = (Date.now() - date) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-ageInDays / 7) * 1.5;
    
    // Penalidade por exposição (até 0.5)
    // Se o anúncio já tem muitas views, damos chance aos outros
    const views = item.views || 0;
    const exposurePenalty = Math.min(0.5, views / 1000); 

    const score = randomFactor + recencyBoost - exposurePenalty;
    return { item, score };
  });

  // Ordena pelo score calculado (maior primeiro)
  return scoredItems
    .sort((a, b) => b.score - a.score)
    .map(si => si.item);
}
