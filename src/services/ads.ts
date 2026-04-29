import { supabase } from '../lib/supabase';
import { Ad, AdFilter, AdStatus } from '../types';

export async function fetchAds(filter: Partial<AdFilter> = {}) {
  const pageSize = filter.pageSize || 12;
  const page = filter.page || 0;
  
  let query = supabase
    .from('ads')
    .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at)', { count: 'exact' })
    .eq('status', 'active');

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
    console.error('Error fetching ads:', error);
    throw new Error('Erro ao buscar anúncios');
  }

  return {
    ads: (data || []) as Ad[],
    totalCount: count || 0,
    hasMore: count ? (from + (data?.length || 0)) < count : false
  };
}

export async function fetchAdById(id: string) {
  const { data, error } = await supabase
    .from('ads')
    .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at), profiles(id, name, whatsapp, neighborhood, avatar_url, role)')
    .eq('id', id)
    .single();

  if (error) {
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

export async function fetchUserAds(userId: string) {
  const { data, error } = await supabase
    .from('ads')
    .select('id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
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
