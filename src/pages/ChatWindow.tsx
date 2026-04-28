import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchMessages, sendMessage, subscribeToMessages } from '../services/chat';
import { Message, Chat } from '../types';
import { ChevronLeft, Send, User as UserIcon, Tag, ExternalLink } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function ChatWindow() {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Chat interno desativado temporariamente para o MVP
    navigate('/');
    return;
    
    /* 
    if (!user) {
      navigate('/login');
      return;
    }
    ...
    */
  }, [chatId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatData = async (id: string) => {
    try {
      // Fetch chat info
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          id, ad_id, buyer_id, seller_id, created_at,
          ad:ads (id, user_id, title, description, price, category, neighborhood, condition, ad_type, status, lat, lng, views, interests, created_at, updated_at, ad_images (id, ad_id, image_url, is_primary, sort_order, created_at)),
          buyer:profiles!buyer_id (id, name, whatsapp, neighborhood, avatar_url, role),
          seller:profiles!seller_id (id, name, whatsapp, neighborhood, avatar_url, role)
        `)
        .eq('id', id)
        .single();

      if (chatError) throw chatError;
      
      const other_party = chatData.buyer_id === user?.id ? chatData.seller : chatData.buyer;
      setChat({ ...chatData, other_party });

      // Fetch initial messages
      const msgData = await fetchMessages(id);
      setMessages(msgData);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    try {
      const content = newMessage.trim();
      setNewMessage('');
      await sendMessage(chatId, user.id, content);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
    </div>
  );

  if (!chat) return <div>Conversa não encontrada.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px-64px)] lg:h-[calc(100vh-64px)] bg-gray-50 max-w-4xl mx-auto shadow-2xl relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chats')} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100">
            <UserIcon className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">{chat.other_party?.name}</h2>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Online agora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Context Bar */}
      <Link 
        to={`/anuncio/${chat.ad?.id}`}
        className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center justify-between group transition-colors hover:bg-primary/10"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-primary/20">
            <img 
              src={chat.ad?.ad_images?.[0]?.image_url} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              alt=""
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-primary transition-colors">
              {chat.ad?.title}
            </h3>
            <p className="text-[11px] font-black text-primary">
              {formatPrice(chat.ad?.price || 0)}
            </p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors flex-shrink-0" />
      </Link>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[80%]",
                  isMe ? "self-end items-end" : "self-start items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-3 rounded-3xl text-sm font-medium shadow-sm",
                  isMe 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                )}>
                  {msg.content}
                </div>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1 mt-1 px-2">
                  {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-grow bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-primary/20"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
