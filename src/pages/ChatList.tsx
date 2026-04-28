import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserChats } from '../services/chat';
import { Chat } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, User as UserIcon, Clock } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadChats();
    */
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const data = await fetchUserChats(user.id);
      setChats(data);
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Carregando conversas...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Minhas Conversas</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-l-2 border-primary pl-2 mt-1">
            {chats.length} chats ativos
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <Link 
              key={chat.id} 
              to={`/chat/${chat.id}`}
              className="block bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <UserIcon className="w-6 h-6 text-gray-300" />
                  </div>
                  {chat.unread_count && chat.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {chat.unread_count}
                    </div>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                      {chat.other_party?.name || 'Usuário'}
                    </h3>
                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap ml-2 uppercase">
                      {formatDate(chat.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest truncate mb-1">
                    Anúncio: {chat.ad?.title}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {chat.last_message?.content || 'Clique para iniciar a conversa'}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-200" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 p-10 rounded-full mb-6 relative">
              <MessageSquare className="w-12 h-12 text-gray-200" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Sem chats</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-medium">
              Você ainda não tem nenhuma conversa. Inicie um chat em qualquer anúncio para falar com o vendedor!
            </p>
            <Link to="/">
              <button className="bg-primary text-white font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-2xl hover:opacity-90 transition-all">
                Explorar Anúncios
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
