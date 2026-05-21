import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { Ad, AdFilter, AdStatus } from '../types';
import { isNonCriticalSupabaseError } from '../lib/utils';

export async function fetchAds(filter: Partial<AdFilter> = {}, signal?: AbortSignal, retryCount = 0): Promise<{ ads: Ad[], totalCount: number, hasMore: boolean }> {
  const pageSize = filter.pageSize || 12;
  const page = filter.page || 0;
  const normalizeValue = (value?: string | null) => value?.trim().toLowerCase() || '';
  const cleanFilter = {
    search: filter.search?.trim() || undefined,
    category: ['todos', 'todas', 'todos os anuncios', 'todos os anúncios', ''].includes(normalizeValue(filter.category)) ? undefined : filter.category?.trim(),
    type: ['all', 'todos', ''].includes(normalizeValue(filter.type)) ? undefined : filter.type,
    condition: ['all', 'todos', ''].includes(normalizeValue(filter.condition)) ? undefined : filter.condition,
    neighborhood: ['todos os bairros', 'todos', ''].includes(normalizeValue(filter.neighborhood)) ? undefined : filter.neighborhood?.trim(),
    sortBy: filter.sortBy || 'recent',
    page,
    pageSize
  };
  
  console.debug("FETCH_ADS_INPUT", { filter });
  
  try {
    let query = supabase
      .from('ads')
      .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, is_external, is_verified, is_featured, external_seller_name, external_seller_phone, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at), profiles(id, name, avatar_url, whatsapp)', { count: 'exact' })
      .eq('status', 'active');

    if (signal) {
      query = query.abortSignal(signal);
    }

    if (cleanFilter.search) {
      const s = cleanFilter.search;
      if (s) {
        const term = `%${s}%`;
        console.debug('QUERY_STEP: filter by search=' + s);
        query = query.or(`title.ilike.${term},description.ilike.${term},neighborhood.ilike.${term}`);
      }
    }

    if (cleanFilter.category) {
      const cat = cleanFilter.category;
      const normalizedCat = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ç/g, "c");
      
      const isServiceSearch = [
        'servicos', 'servico', 'service'
      ].includes(normalizedCat);
      
      console.debug('CATEGORY_FILTER_NORMALIZATION', {
        original: cleanFilter.category,
        normalized: normalizedCat,
        isServiceSearch
      });

      if (isServiceSearch) {
        console.debug('QUERY_STEP: filter by ad_type=service');
        query = query.eq('ad_type', 'service');
      } else {
        console.debug('QUERY_STEP: filter by category=' + cleanFilter.category);
        query = query.eq('category', cleanFilter.category);
      }
    }

    if (cleanFilter.type) {
      console.debug('QUERY_STEP: filter by ad_type=' + cleanFilter.type);
      query = query.eq('ad_type', cleanFilter.type);
    }

    if (cleanFilter.neighborhood) {
      query = query.eq('neighborhood', cleanFilter.neighborhood);
    }

    // Ordenação
    if (cleanFilter.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (cleanFilter.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Paginação
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const timeoutId = setTimeout(() => {
      console.warn("FETCH_ADS_TIMEOUT", {
        page,
        pageSize,
        sortBy: cleanFilter.sortBy,
        from,
        to
      });
    }, 15000);

    const { data, error, count } = await Promise.resolve(query).finally(() => {
      clearTimeout(timeoutId);
    });

    console.debug('FETCH_ADS_RESULT', {
      countReturned: data?.length || 0,
      totalCount: count,
      error
    });
    if (error) {
      console.error("FETCH_ADS_SUPABASE_ERROR", error);
    }

    if (error) {
      if (signal?.aborted || error?.name === 'AbortError' || error?.message?.includes('AbortError') || error?.message?.includes('signal is aborted')) {
        console.debug("FETCH_ABORT_IGNORED", error);
        throw error;
      }
      if (isNonCriticalSupabaseError(error) && retryCount < 1) {
        console.warn('Retrying fetchAds due to non-critical error:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchAds(filter, signal, retryCount + 1);
      }
      
      if (isNonCriticalSupabaseError(error)) {
        throw error;
      }

      console.error('Supabase fetchAds error:', error);
      throw new Error(error.message || 'Erro ao buscar anúncios');
    }

    return {
      ads: (data || []).map(ad => ({
        ...ad,
        profiles: Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles
      })) as Ad[],
      totalCount: count || 0,
      hasMore: count ? (from + (data?.length || 0)) < count : false
    };
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('AbortError') || err?.message?.includes('signal is aborted')) {
      console.debug("FETCH_ABORT_IGNORED", err);
      throw err;
    }

    if (isNonCriticalSupabaseError(err) && retryCount < 1) {
      console.warn('Retrying fetchAds due to non-critical error in catch:', err);
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchAds(filter, signal, retryCount + 1);
    }

    console.error('Unexpected error in fetchAds:', err);
    return { ads: [], totalCount: 0, hasMore: false };
  } finally {
    console.debug("FETCH_ADS_FINISHED");
  }
}

export async function fetchAdById(id: string, signal?: AbortSignal) {
  try {
    let query = supabase
      .from('ads')
      .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, is_external, is_verified, is_featured, external_seller_name, external_seller_phone, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at), profiles(id, name, whatsapp, neighborhood, avatar_url, role)')
      .eq('id', id);

    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("DETAIL_FETCH_ERROR", error);
      if (isNonCriticalSupabaseError(error)) throw error;
      console.error('Supabase error fetching ad by id:', error);
      throw error;
    }

    if (!data) return null;

    // Tenta carregar as colunas de prova social se existirem no banco
    let views_count = data.views || 0;
    let whatsapp_clicks_count = data.interests || 0;
    let shares_count = 0;

    try {
      const socialProofResult = await Promise.race([
        supabase
          .from('ads')
          .select('views_count, whatsapp_clicks_count, shares_count')
          .eq('id', id)
          .maybeSingle()
          .then(result => ({ ...result, timedOut: false })),
        new Promise<{ data: null; error: null; timedOut: true }>((resolve) => {
          setTimeout(() => resolve({ data: null, error: null, timedOut: true }), 1500);
        })
      ]) as {
        data: { views_count?: number; whatsapp_clicks_count?: number; shares_count?: number } | null;
        error: unknown;
        timedOut: boolean;
      };

      if (socialProofResult.timedOut) {
        console.debug("DETAIL_SOCIAL_PROOF_TIMEOUT", { adId: id });
      }

      const { data: socialProof, error: spError } = socialProofResult;

      if (!spError && socialProof) {
        views_count = socialProof.views_count ?? (data.views || 0);
        whatsapp_clicks_count = socialProof.whatsapp_clicks_count ?? (data.interests || 0);
        shares_count = socialProof.shares_count ?? 0;
      }
    } catch (spErr) {
      console.debug("Colunas opcionais de prova social nao encontradas, usando fallbacks (views/interests).", spErr);
    }

    // Flatten profiles if it's an array
    const ad = {
      ...data,
      views_count,
      whatsapp_clicks_count,
      shares_count,
      profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
    };

    return ad as Ad;
  } catch (err: any) {
    console.error("DETAIL_FETCH_ERROR", err);
    if (isNonCriticalSupabaseError(err)) throw err;
    console.error('Unexpected error in fetchAdById:', err);
    throw err;
  }
}

export async function incrementAdViewsCount(adId: string, currentViews: number = 0) {
  try {
    // Tenta primeiro via RPC
    const { error: rpcError } = await supabase.rpc('increment_ad_views', { ad_id: adId });
    if (!rpcError) return currentViews + 1;
    console.debug('increment_ad_views RPC failed, falling back', rpcError);

    // 1. Tenta atualizar views_count
    const { error: err1 } = await supabase
      .from('ads')
      .update({ views_count: currentViews + 1 })
      .eq('id', adId);
    
    if (!err1) return currentViews + 1;

    // 2. Se falhar (ex: coluna nao existe), atualiza a coluna views existente
    const { error: err2 } = await supabase
      .from('ads')
      .update({ views: currentViews + 1 })
      .eq('id', adId);
    
    if (!err2) return currentViews + 1;
  } catch (e) {
    console.debug('Failed to increment views in DB, falling back to local only', e);
  }
  return currentViews + 1;
}

export async function incrementAdWhatsAppClicks(adId: string, currentClicks: number = 0) {
  try {
    // Registrar clique na tabela ad_clicks de forma assíncrona
    logAdClick(adId, 'whatsapp');

    // Tenta primeiro via RPC
    const { error: rpcError } = await supabase.rpc('increment_ad_whatsapp_clicks', { ad_id: adId });
    if (!rpcError) return currentClicks + 1;
    console.debug('increment_ad_whatsapp_clicks RPC failed, falling back', rpcError);

    // 2. Tenta atualizar whatsapp_clicks_count
    const { error: err1 } = await supabase
      .from('ads')
      .update({ whatsapp_clicks_count: currentClicks + 1 })
      .eq('id', adId);
    
    if (!err1) return currentClicks + 1;

    // 3. Se falhar, atualiza a coluna interests existente
    const { error: err2 } = await supabase
      .from('ads')
      .update({ interests: currentClicks + 1 })
      .eq('id', adId);
    
    if (!err2) return currentClicks + 1;
  } catch (e) {
    console.debug('Failed to increment WhatsApp clicks in DB', e);
  }
  return currentClicks + 1;
}

export async function incrementAdShares(adId: string, currentShares: number = 0) {
  try {
    // Tenta primeiro via RPC
    const { error: rpcError } = await supabase.rpc('increment_ad_shares', { ad_id: adId });
    if (!rpcError) return currentShares + 1;
    console.debug('increment_ad_shares RPC failed, falling back', rpcError);

    const { error } = await supabase
      .from('ads')
      .update({ shares_count: currentShares + 1 })
      .eq('id', adId);
    
    if (!error) return currentShares + 1;
  } catch (e) {
    console.debug('Failed to increment shares in DB', e);
  }
  return currentShares + 1;
}

export async function fetchUserAds(userId: string, signal?: AbortSignal) {
  let query = supabase
    .from('ads')
    .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, is_external, is_verified, is_featured, external_seller_name, external_seller_phone, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) {
    if (isNonCriticalSupabaseError(error)) throw error;
    console.error('Error fetching user ads:', error);
    throw new Error('Erro ao buscar seus anúncios');
  }

  return (data || []) as Ad[];
}

export async function createAd(adData: Omit<Ad, 'id' | 'created_at' | 'updated_at' | 'ad_images' | 'profiles'>) {
  const { data, error } = await supabase
    .from('ads')
    .insert([adData])
    .select('id')
    .single();

  if (error) {
    console.error('Error creating ad:', error);
    if (error.code === '42501') {
      throw new Error('Você não tem permissão para criar anúncios. Verifique se está logado.');
    }
    throw new Error('Erro ao publicar anúncio. Tente novamente.');
  }

  return data as Ad;
}

export async function updateAd(id: string, adData: Partial<Ad>) {
  const { data, error } = await supabase
    .from('ads')
    .update(adData)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('Error updating ad:', error);
    throw new Error('Erro ao atualizar anúncio');
  }

  return data as Ad;
}

export async function updateAdStatus(id: string, status: AdStatus) {
  console.log('UPDATING_AD_STATUS', { id, status });
  const { data, error } = await supabase
    .from('ads')
    .update({ status })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating ad status:', error);
    throw new Error(error.message || 'Erro ao atualizar status do anúncio');
  }

  if (!data) {
    throw new Error('Anúncio não encontrado ou sem permissão para atualizar');
  }

  return data as Ad;
}

export async function toggleAdVerification(id: string, isVerified: boolean) {
  console.log('TOGGLING_VERIFICATION', { id, isVerified });
  const { data, error } = await supabase
    .from('ads')
    .update({ is_verified: isVerified })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error toggling ad verification:', error);
    throw new Error(error.message || 'Erro ao atualizar verificação do anúncio');
  }

  return data as Ad;
}

export async function toggleAdFeature(id: string, isFeatured: boolean) {
  console.log('TOGGLING_FEATURE', { id, isFeatured });
  const { data, error } = await supabase
    .from('ads')
    .update({ is_featured: isFeatured })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error toggling ad feature:', error);
    throw new Error(error.message || 'Erro ao atualizar destaque do anúncio');
  }

  return data as Ad;
}

const MAX_IMAGE_INPUT_SIZE = 10 * 1024 * 1024;
const MAX_UNCOMPRESSED_FALLBACK_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function getFileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || '';
}

function validateImageFile(file: File) {
  const extension = getFileExtension(file);
  const hasAllowedMime = ALLOWED_IMAGE_TYPES.includes(file.type);
  const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.includes(extension);

  if (!hasAllowedMime && !hasAllowedExtension) {
    throw new Error('Formato de imagem nao suportado. Envie fotos em JPG, PNG ou WebP.');
  }

  if (file.size > MAX_IMAGE_INPUT_SIZE) {
    throw new Error('A imagem selecionada e muito grande (maximo 10MB). Escolha uma foto menor.');
  }
}

export async function uploadAdImage(adId: string, userId: string, file: File, isPrimary = false) {
  validateImageFile(file);

  // Otimizar imagem (comprimir, redimensionar e converter para WebP)
  let fileToUpload: File | Blob = file;
  let extension = getFileExtension(file) || 'jpg';

  try {
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/webp' as any,
      initialQuality: 0.75
    };

    const compressedBlob = await imageCompression(file, options);
    
    // Criar um novo File a partir do Blob comprimido para manter metadados básicos ou extensões corretas
    fileToUpload = new File([compressedBlob], `image.webp`, { type: 'image/webp' });
    extension = 'webp';
  } catch (compressionError) {
    console.warn('Erro ao comprimir imagem, tentando upload original:', compressionError);

    if (file.size > MAX_UNCOMPRESSED_FALLBACK_SIZE) {
      throw new Error('Nao foi possivel otimizar esta imagem. Tente enviar uma foto em JPG, PNG ou WebP com ate 3MB.');
    }
  }

  // Convenção: ad-images/{user_id}/{ad_id}/{filename}
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${extension}`;
  const filePath = `${userId}/${adId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('ad-images')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
      contentType: fileToUpload.type || file.type || undefined
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error('Erro ao fazer upload da imagem');
  }

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('ad-images')
    .getPublicUrl(filePath);

  // Se esta for marcada como principal, desmarcamos as outras primeiro
  if (isPrimary) {
    await supabase
      .from('ad_images')
      .update({ is_primary: false })
      .eq('ad_id', adId);
  }

  // Criar registro na tabela ad_images
  const { data: imageData, error: dbError } = await supabase
    .from('ad_images')
    .insert([{
      ad_id: adId,
      image_url: publicUrl,
      is_primary: isPrimary,
      sort_order: 0
    }])
    .select('id')
    .single();

  if (dbError) {
    console.error('Error saving image record:', dbError);
    await supabase.storage.from('ad-images').remove([filePath]);
    throw new Error('Erro ao salvar registro da imagem');
  }

  return imageData;
}

export async function deleteAdImage(imageId: string, imageUrl: string) {
  // 1. Deletar do banco
  const { error: dbError } = await supabase
    .from('ad_images')
    .delete()
    .eq('id', imageId);

  if (dbError) {
    console.error('Error deleting image record:', dbError);
    throw new Error('Erro ao remover registro da imagem');
  }

  // 2. Extrair o path do Storage a partir da URL
  const parts = imageUrl.split('/ad-images/');
  if (parts.length > 1) {
    const path = parts[1];
    const { error: storageError } = await supabase.storage
      .from('ad-images')
      .remove([path]);
    
    if (storageError) {
      console.warn('Error deleting file from storage (orphaned):', storageError);
    }
  }
}

export async function setPrimaryImage(adId: string, imageId: string) {
  const { data: resetData, error: resetError } = await supabase
    .from("ad_images")
    .update({ is_primary: false })
    .eq("ad_id", adId)
    .select("id, is_primary, sort_order");

  if (resetError) {
    console.error("Erro ao resetar imagens primárias:", resetError);
    throw resetError;
  }

  const { data: primaryData, error: primaryError } = await supabase
    .from("ad_images")
    .update({ is_primary: true, sort_order: 0 })
    .eq("ad_id", adId)
    .eq("id", imageId)
    .select("id, is_primary, sort_order");

  if (primaryError) {
    console.error("Erro ao definir imagem primária:", primaryError);
    throw primaryError;
  }
}

export async function deleteAd(id: string) {
  const { error } = await supabase
    .from('ads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ad:', error);
    throw new Error('Erro ao excluir anúncio');
  }
}

export async function logAdClick(adId: string, type: 'whatsapp') {
  // Fire and forget: inicia a execução mas não aguarda o resultado no fluxo principal
  (async () => {
    try {
      const { error } = await supabase
        .from('ad_clicks')
        .insert([{ ad_id: adId, type }]);
      
      if (error && !isNonCriticalSupabaseError(error)) {
        console.warn('Click logging failed:', error);
      }
    } catch (err) {
      if (!isNonCriticalSupabaseError(err)) {
        console.warn('Unexpected error logging click:', err);
      }
    }
  })();
}

function isMissingMetricColumnError(error: any) {
  const message = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  const code = String(error?.code || '');

  return (
    code === '42703' ||
    message.includes('views_count') ||
    message.includes('whatsapp_clicks_count') ||
    message.includes('shares_count')
  );
}

function logSupabaseQueryError(context: string, error: any) {
  console.error(context, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code
  });
}

export async function fetchTrafficStats(signal?: AbortSignal): Promise<{
  qrCartao: number;
  qrUnicos: number;
  planosVisits: number;
  planosUnicos: number;
  ctaPublicar: number;
  ctaCadastro: number;
}> {
  try {
    const trackedOrigins = [
      'cartaoA4',
      'pagina_anunciar',
      'cta_planos_publicar',
      'cta_planos_publicar_final',
      'cta_planos_cadastro'
    ];

    let query = supabase
      .from('traffic_events')
      .select('origem, session_id')
      .in('origem', trackedOrigins);

    if (signal instanceof AbortSignal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) {
      if (isNonCriticalSupabaseError(error)) {
        return { qrCartao: 0, qrUnicos: 0, planosVisits: 0, planosUnicos: 0, ctaPublicar: 0, ctaCadastro: 0 };
      }
      throw error;
    }

    const events = data || [];
    const byOrigin = (origem: string) => events.filter(event => event.origem === origem);
    const uniqueSessions = (rows: { session_id?: string | null }[]) => new Set(rows.map(event => event.session_id).filter(Boolean)).size;
    const qrEvents = byOrigin('cartaoA4');
    const planosEvents = byOrigin('pagina_anunciar');

    return {
      qrCartao: qrEvents.length,
      qrUnicos: uniqueSessions(qrEvents),
      planosVisits: planosEvents.length,
      planosUnicos: uniqueSessions(planosEvents),
      ctaPublicar: byOrigin('cta_planos_publicar').length + byOrigin('cta_planos_publicar_final').length,
      ctaCadastro: byOrigin('cta_planos_cadastro').length
    };
  } catch (err) {
    if (!isNonCriticalSupabaseError(err)) {
      console.debug('Traffic stats unavailable, skipping optional metrics.', err);
    }

    return { qrCartao: 0, qrUnicos: 0, planosVisits: 0, planosUnicos: 0, ctaPublicar: 0, ctaCadastro: 0 };
  }
}

export async function fetchAdminStats(signal?: AbortSignal) {
  try {
    let query = supabase
      .from('ads')
      .select('id, status, ad_type, views, interests');
    
    if (signal instanceof AbortSignal) query = query.abortSignal(signal);

    const { data: baseAds, error: adsError } = await query;

    if (adsError) {
      logSupabaseQueryError('Supabase base error in fetchAdminStats', adsError);
      if (isNonCriticalSupabaseError(adsError)) return null;
      throw adsError;
    }

    const ads = (baseAds || []) as any[];
    const mergeStatsById = (rows: any[] | null | undefined) => {
      const byId = new Map<string, any>();
      (rows || []).forEach(row => {
        if (row?.id) byId.set(row.id, row);
      });

      ads.forEach(ad => {
        const extra = byId.get(ad.id);
        if (extra) Object.assign(ad, extra);
      });
    };

    const fetchOptionalStatsFields = async (label: string, select: string) => {
      let optionalQuery = supabase
        .from('ads')
        .select(select);

      if (signal instanceof AbortSignal) optionalQuery = optionalQuery.abortSignal(signal);

      const { data, error } = await optionalQuery;
      if (error) {
        logSupabaseQueryError(`Optional admin stats query failed: ${label}`, error);
        return;
      }

      mergeStatsById(data as any[]);
    };

    await fetchOptionalStatsFields(
      'metricas novas',
      'id, views_count, whatsapp_clicks_count, shares_count'
    );

    await fetchOptionalStatsFields('flags externas', 'id, is_external');

    let usersQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (signal instanceof AbortSignal) usersQuery = usersQuery.abortSignal(signal);

    const { count: usersCount, error: usersError } = await usersQuery;
    let safeUsersCount = usersCount || 0;
    if (usersError) {
      logSupabaseQueryError('Optional admin users count failed', usersError);
      safeUsersCount = 0;
    }

    let clicksQuery = supabase
      .from('ad_clicks')
      .select('id, ad_id');

    if (signal instanceof AbortSignal) clicksQuery = clicksQuery.abortSignal(signal);

    const { data: clicks, error: clicksError } = await clicksQuery;
    let safeClicks = clicks || [];
    if (clicksError) {
      logSupabaseQueryError('Optional admin clicks count failed', clicksError);
      safeClicks = [];
    }

    const trafficStats = await fetchTrafficStats(signal);
    const getMetric = (primary?: number | null, fallback?: number | null) => Number(primary ?? fallback ?? 0) || 0;

    const stats = {
      total: ads.length,
      active: ads.filter(a => a.status === 'active').length,
      sold: ads.filter(a => a.status === 'sold').length,
      hidden: ads.filter(a => a.status === 'hidden').length,
      sale: ads.filter(a => a.status === 'active' && a.ad_type === 'sale').length,
      rent: ads.filter(a => a.status === 'active' && a.ad_type === 'rent').length,
      service: ads.filter(a => a.status === 'active' && a.ad_type === 'service').length,
      removed: ads.filter(a => a.status === 'removed').length,
      external: ads.filter(a => a.is_external).length,
      totalViews: ads.reduce((sum, ad) => sum + getMetric(ad.views_count, ad.views), 0),
      totalWhatsAppClicks: ads.reduce((sum, ad) => sum + getMetric(ad.whatsapp_clicks_count, ad.interests), 0),
      totalShares: ads.reduce((sum, ad) => sum + getMetric(ad.shares_count), 0),
      totalUsers: safeUsersCount,
      totalClicks: safeClicks.length,
      qrCartao: trafficStats.qrCartao,
      qrUnicos: trafficStats.qrUnicos,
      planosVisits: trafficStats.planosVisits,
      planosUnicos: trafficStats.planosUnicos,
      ctaPublicar: trafficStats.ctaPublicar,
      ctaCadastro: trafficStats.ctaCadastro
    };

    return stats;
  } catch (err: any) {
    if (isNonCriticalSupabaseError(err)) return null;
    console.error('Error fetching admin stats:', err);
    throw new Error('Erro ao buscar estatísticas de anúncios');
  }
}

export async function fetchAdminAds(signal?: AbortSignal) {
  try {
    console.log('FETCHING_ADMIN_ADS...');
    const baseSelect = 'id, title, description, price, category, neighborhood, ad_type, status, views, interests, created_at';

    let baseQuery = supabase
      .from('ads')
      .select(baseSelect)
      .order('created_at', { ascending: false });

    if (signal instanceof AbortSignal) baseQuery = baseQuery.abortSignal(signal);

    const { data: baseAds, error: baseError } = await baseQuery;

    if (baseError) {
      logSupabaseQueryError('Supabase base error in fetchAdminAds', baseError);
      if (isNonCriticalSupabaseError(baseError)) return [];
      throw baseError;
    }

    const adminAds = ((baseAds || []) as any[]).map(ad => ({ ...ad }));
    const mergeById = (rows: any[] | null | undefined) => {
      const byId = new Map<string, any>();
      (rows || []).forEach(row => {
        if (row?.id) byId.set(row.id, row);
      });

      adminAds.forEach(ad => {
        const extra = byId.get(ad.id);
        if (extra) Object.assign(ad, extra);
      });
    };

    const fetchOptionalAdminFields = async (label: string, select: string) => {
      let optionalQuery = supabase
        .from('ads')
        .select(select);

      if (signal instanceof AbortSignal) optionalQuery = optionalQuery.abortSignal(signal);

      const { data, error } = await optionalQuery;
      if (error) {
        logSupabaseQueryError(`Optional admin ads query failed: ${label}`, error);
        return;
      }

      mergeById(data as any[]);
    };

    await fetchOptionalAdminFields(
      'metricas novas',
      'id, views_count, whatsapp_clicks_count, shares_count'
    );

    await fetchOptionalAdminFields(
      'flags externas',
      'id, is_external, is_verified, is_featured, external_seller_name, external_seller_phone'
    );

    await fetchOptionalAdminFields(
      'imagens',
      'id, ad_images(image_url)'
    );

    await fetchOptionalAdminFields(
      'perfis',
      'id, profiles(name, phone, whatsapp, avatar_url, role)'
    );

    console.log('ADMIN_ADS_LOADED', { count: adminAds.length });
    return adminAds.map(ad => ({
      ...ad,
      views_count: ad.views_count ?? ad.views ?? 0,
      whatsapp_clicks_count: ad.whatsapp_clicks_count ?? ad.interests ?? 0,
      shares_count: ad.shares_count ?? 0,
      profiles: Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles
    })) as any[];
  } catch (err: any) {
    if (isNonCriticalSupabaseError(err)) return [];
    console.error('Error fetching admin ads:', err);
    throw new Error('Erro ao buscar todos os anúncios');
  }
}
