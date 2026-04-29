import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminStats, fetchAdminAds, updateAdStatus } from '../services/ads';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { Shield, Users, Package, AlertTriangle, Eye, Trash2, CheckCircle, Clock, TrendingUp, Search, Filter, MessageSquare, Tag, LayoutGrid } from 'lucide-react';
import Button from '../components/ui/Button';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        fetchAdminStats(signal), 
        fetchAdminAds(signal)
      ]);
      if (signal?.aborted) return;
      setStats(s);
      setAds(a);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Erro ao carregar dados do painel');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este anúncio? Ele não aparecerá mais para os usuários.')) return;
    
    try {
      await updateAdStatus(id, 'removed');
      alert('Anúncio removido com sucesso!');
      await loadData();
    } catch (err: any) {
      console.error('Erro ao remover:', err);
      alert('Erro ao desativar anúncio: ' + err.message);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await updateAdStatus(id, 'active');
      alert('Anúncio reativado com sucesso!');
      await loadData();
    } catch (err: any) {
      alert('Erro ao ativar anúncio: ' + err.message);
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ad.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ad.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Carregando central de controle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Moderação</h1>
          </div>
          <p className="text-gray-400 font-medium italic">Gerencie o mercado e monitore o crescimento.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Atualizar Dados
        </Button>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-4 text-red-700 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-8 h-8 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-tight">Ocorreu um erro no sistema</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Métrica Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
          <StatCard icon={<CheckCircle />} label="Ativos" value={stats.active} color="emerald" />
          <StatCard icon={<Tag />} label="Vendas" value={stats.sale} color="indigo" />
          <StatCard icon={<LayoutGrid />} label="Aluguel" value={stats.rent} color="blue" />
          <StatCard icon={<MessageSquare />} label="Serviços" value={stats.service} color="purple" />
          <StatCard icon={<AlertTriangle />} label="Removidos" value={stats.removed} color="red" />
          <StatCard icon={<Users />} label="Usuários" value={stats.totalUsers} color="amber" />
          <StatCard icon={<TrendingUp />} label="Cliques" value={stats.totalClicks} color="primary" />
        </div>
      )}

      {/* Tabela de Anúncios */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por título, usuário ou bairro..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            {['all', 'active', 'sold', 'hidden', 'removed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === status 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                )}
              >
                {status === 'all' ? 'Tudo' : status === 'active' ? 'Ativos' : status === 'sold' ? 'Vendidos' : status === 'hidden' ? 'Ocultos' : 'Removidos'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Anúncio</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vendedor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Local / Cat</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Preço</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAds.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                        {ad.ad_images?.[0]?.image_url ? (
                          <img src={ad.ad_images[0].image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-300 m-auto mt-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm line-clamp-1">{ad.title}</div>
                        <div className="text-[10px] text-gray-400 font-medium flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" /> {formatDate(ad.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-gray-700 uppercase tracking-tight">{ad.profiles?.name || 'Sistema'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-gray-600">{ad.neighborhood}</div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{ad.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-primary">
                      {ad.ad_type === 'service' && ad.price === 0 ? 'A combinar' : formatPrice(ad.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm",
                      ad.status === 'active' ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" :
                      ad.status === 'sold' ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100" :
                      ad.status === 'hidden' ? "bg-gray-100 text-gray-500" :
                      "bg-red-50 text-red-600 ring-1 ring-red-100"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", ad.status === 'active' ? "bg-emerald-600" : ad.status === 'removed' ? "bg-red-600" : "bg-gray-400")}></div>
                      {ad.status === 'active' ? 'Ativo' : ad.status === 'sold' ? 'Vendido' : ad.status === 'hidden' ? 'Oculto' : 'Removido'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/anuncio/${ad.id}`} 
                        className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-primary/10 hover:text-primary rounded-xl transition-all shadow-sm"
                        title="Visualizar Anúncio"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {ad.status === 'removed' ? (
                        <button 
                          onClick={() => handleActivate(ad.id)}
                          className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-500 hover:bg-emerald-100 rounded-xl transition-all shadow-sm"
                          title="Reativar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleDeactivate(ad.id)}
                          className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all shadow-sm"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAds.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10" />
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum anúncio encontrado com esses filtros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-500 ring-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-500 ring-indigo-100',
    blue: 'bg-blue-50 text-blue-500 ring-blue-100',
    purple: 'bg-purple-50 text-purple-500 ring-purple-100',
    red: 'bg-red-50 text-red-500 ring-red-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    primary: 'bg-primary/5 text-primary ring-primary/10',
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-gray-200/60 transition-all group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors[color])}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <div className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">{label}</div>
    </div>
  );
}
