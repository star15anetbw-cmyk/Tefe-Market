export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  neighborhood: string | null;
  city: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type AdType = 'sale' | 'rent';
export type AdCondition = 'new' | 'used';
export type AdStatus = 'active' | 'sold' | 'hidden';

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  ad_type: AdType;
  condition: AdCondition;
  category: string;
  neighborhood: string;
  status: AdStatus;
  views?: number;
  interests?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at?: string;
  profiles?: Profile;
  ad_images?: AdImage[];
}

export interface AdImage {
  id: string;
  ad_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at?: string;
}

export type AdSortBy = 'recent' | 'price_asc' | 'price_desc';

export interface AdFilter {
  search: string;
  category: string;
  type: AdType | 'all';
  condition: AdCondition | 'all';
  sortBy?: AdSortBy;
  page?: number;
  pageSize?: number;
}

export interface Favorite {
  user_id: string;
  ad_id: string;
  created_at: string;
  ad?: Ad;
}

export interface Chat {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  ad?: Ad;
  last_message?: Message;
  unread_count?: number;
  other_party?: Profile;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
