import { supabase } from '../lib/supabase';
import { Chat, Message } from '../types';

export const getOrCreateChat = async (adId: string, buyerId: string, sellerId: string): Promise<string> => {
  // Check if chat already exists
  const { data: existingChat, error: findError } = await supabase
    .from('chats')
    .select('id')
    .match({ ad_id: adId, buyer_id: buyerId, seller_id: sellerId })
    .single();

  if (existingChat) return existingChat.id;
  if (findError && findError.code !== 'PGRST116') throw findError;

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert({ ad_id: adId, buyer_id: buyerId, seller_id: sellerId })
    .select('id')
    .single();

  if (createError) throw createError;
  return newChat.id;
};

export const fetchUserChats = async (userId: string): Promise<Chat[]> => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      id, ad_id, buyer_id, seller_id, created_at,
      ad:ads (id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images(id, ad_id, image_url, is_primary, sort_order, created_at)),
      buyer:profiles!buyer_id (id, name, whatsapp, neighborhood, avatar_url, role),
      seller:profiles!seller_id (id, name, whatsapp, neighborhood, avatar_url, role)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Map other party profile
  return data.map((chat: any) => ({
    ...chat,
    other_party: chat.buyer_id === userId ? chat.seller : chat.buyer
  }));
};

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const sendMessage = async (chatId: string, senderId: string, content: string) => {
  const { error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, content });

  if (error) throw error;
};

export const subscribeToMessages = (chatId: string, callback: (message: Message) => void) => {
  return supabase
    .channel(`chat:${chatId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `chat_id=eq.${chatId}` 
    }, (payload) => {
      callback(payload.new as Message);
    })
    .subscribe();
};
