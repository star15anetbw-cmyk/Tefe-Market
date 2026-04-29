import { supabase } from '../lib/supabase';
import { Ad, AdFilter, AdStatus } from '../types';

export async function fetchAds(filter: Partial<AdFilter> = {}, signal?: AbortSignal) {
  const pageSize = filter.pageSize || 12;
  const page = filter.page || 0;
  
  try {
    let query = supabase
      .from('ads')
      .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at)', { count: 'exact' })
      .eq('status', 'active');

    if (signal) {
      query = query.abortSignal(signal);
    }

  // Filtros
  if (filter.search) {
    const s = filter.search.trim();
    if (s) {
      const term = `%${s}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},neighborhood.ilike.${term}`);
    }
  }

  if (filter.category && filter.category !== 'Todos') {
    query = query.eq('category', filter.category);
  }

  if (filter.type && filter.type !== 'all') {
    query = query.eq('ad_type', filter.type);
  }

  // Ordenação
  if (filter.sortBy === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (filter.sortBy === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Paginação
  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase fetchAds error:', error);
      // Don't throw if it's a known non-critical error or just return empty
      if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) {
        return { ads: [], totalCount: 0, hasMore: false };
      }
      throw new Error(error.message || 'Erro ao buscar anúncios');
    }

    return {
      ads: (data || []) as Ad[],
      totalCount: count || 0,
      hasMore: count ? (from + (data?.length || 0)) < count : false
    };
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('AbortError') || err.message?.includes('Lock broken')) {
      return { ads: [], totalCount: 0, hasMore: false };
    }
    console.error('Unexpected error in fetchAds:', err);
    throw err;
  }
}

export async function fetchAdById(id: string, signal?: AbortSignal) {
  let query = supabase
    .from('ads')
    .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at), profiles(id, name, whatsapp, neighborhood, avatar_url, role)')
    .eq('id', id);

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return null;
    console.error('Error fetching ad by id:', error);
    throw new Error('Anúncio não encontrado');
  }

  // Flatten profiles if it's an array
  const ad = {
    ...data,
    profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  };

  return ad as Ad;
}

export async function fetchUserAds(userId: string, signal?: AbortSignal) {
  let query = supabase
    .from('ads')
    .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return [];
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
  const { data, error } = await supabase
    .from('ads')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('Error updating ad status:', error);
    throw new Error('Erro ao atualizar status do anúncio');
  }

  return data as Ad;
}

export async function uploadAdImage(adId: string, userId: string, file: File, isPrimary = false) {
  // Convenção: ad-images/{user_id}/{ad_id}/{filename}
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${adId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('ad-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
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
  // 1. Desmarcar todas
  await supabase
    .from('ad_images')
    .update({ is_primary: false })
    .eq('ad_id', adId);

  // 2. Marcar a escolhida
  const { error } = await supabase
    .from('ad_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (error) {
    console.error('Error setting primary image:', error);
    throw new Error('Erro ao definir imagem principal');
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
  try {
    await supabase
      .from('ad_clicks')
      .insert([{ ad_id: adId, type }]);
  } catch (err) {
    console.warn('Erro ao registrar clique:', err);
  }
}

export async function fetchAdminStats(signal?: AbortSignal) {
  let query = supabase
    .from('ads')
    .select('status, ad_type');
  
  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data: ads, error: adsError } = await query;
  
  if (adsError) {
    if (adsError.message?.includes('AbortError')) return null;
    throw new Error('Erro ao buscar estatísticas de anúncios');
  }

  let usersQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (signal) {
    usersQuery = usersQuery.abortSignal(signal);
  }

  const { count: usersCount, error: usersError } = await usersQuery;

  if (usersError) {
    if (usersError.message?.includes('AbortError')) return null;
    throw new Error('Erro ao buscar contagem de usuários');
  }

  let clicksQuery = supabase
    .from('ad_clicks')
    .select('id, ad_id');

  if (signal) {
    clicksQuery = clicksQuery.abortSignal(signal);
  }

  const { data: clicks, error: clicksError } = await clicksQuery;

  if (clicksError) {
    if (clicksError.message?.includes('AbortError')) return null;
    throw new Error('Erro ao buscar cliques');
  }

  const stats = {
    active: ads.filter(a => a.status === 'active').length,
    sale: ads.filter(a => a.status === 'active' && a.ad_type === 'sale').length,
    rent: ads.filter(a => a.status === 'active' && a.ad_type === 'rent').length,
    service: ads.filter(a => a.status === 'active' && a.ad_type === 'service').length,
    removed: ads.filter(a => a.status === 'removed').length,
    totalUsers: usersCount || 0,
    totalClicks: clicks.length || 0
  };

  return stats;
}

export async function fetchAdminAds(signal?: AbortSignal) {
  let query = supabase
    .from('ads')
    .select('id, title, price, category, neighborhood, ad_type, status, created_at, ad_images(image_url), profiles(name)')
    .order('created_at', { ascending: false });

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return [];
    console.error('Error fetching admin ads:', error);
    throw new Error('Erro ao buscar todos os anúncios');
  }

  return (data || []) as any[];
}
