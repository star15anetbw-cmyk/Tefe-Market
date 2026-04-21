import { supabase } from '../lib/supabase';
import { Favorite } from '../types';

export const toggleFavorite = async (userId: string, adId: string, isFavorited: boolean) => {
  if (isFavorited) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ user_id: userId, ad_id: adId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, ad_id: adId });
    if (error) throw error;
  }
};

export const fetchFavorites = async (userId: string): Promise<Favorite[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      user_id,
      ad_id,
      created_at,
      ad:ads (
        *,
        ad_images (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
};

export const checkIsFavorited = async (userId: string | undefined, adId: string): Promise<boolean> => {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('favorites')
    .select('ad_id')
    .match({ user_id: userId, ad_id: adId })
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};
