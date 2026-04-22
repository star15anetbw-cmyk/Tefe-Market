import { supabase } from '../lib/supabase';
import { Favorite } from '../types';

export const toggleFavorite = async (userId: string, adId: string, isCurrentlyFavorited: boolean) => {
  if (isCurrentlyFavorited) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('ad_id', adId);
    
    if (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, ad_id: adId });
    
    if (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
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
  // Usamos maybeSingle() em vez de single() para evitar o erro 406 (PGRST116) 
  // quando nenhum registro é encontrado, que é o comportamento esperado aqui.
  const { data, error } = await supabase
    .from('favorites')
    .select('ad_id')
    .match({ user_id: userId, ad_id: adId })
    .maybeSingle();

  if (error) {
    console.error('Error checking favorite state:', error);
    return false;
  }
  return !!data;
};
