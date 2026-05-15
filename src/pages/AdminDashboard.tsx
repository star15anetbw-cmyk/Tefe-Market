import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { fetchAdminStats, fetchAdminAds, updateAdStatus, toggleAdVerification, toggleAdFeature } from '../services/ads';
import { formatPrice, formatDate, cn, handleImageError } from '../lib/utils';
import { CATEGORIES, NEIGHBORHOODS } from '../constants';
import { Shield, Users, Package, AlertTriangle, Eye, Trash2, Edit2, CheckCircle, Clock, TrendingUp, Search, Filter, MessageSquare, LayoutGrid, BadgeCheck, Star, XCircle, ShoppingBag, ExternalLink, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { user, profile, isAdmin } = useAuth();
  
  React.useEffect(() => {
    console.log('ADMIN_DASHBOARD_MOUNTED v1.1', { 
      userId: user?.id, 
      userEmail: user?.email,
      role: profile?.role,
      isAdmin 
    });
  }, [user, profile, isAdmin]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [externalFilter, setExternalFilter] = useState('all');

  // Queries
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchAdminStats(),
  });

  const adsQuery = useQuery({
    queryKey: ['admin-ads'],
    queryFn: () => fetchAdminAds(),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateAdStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => alert('Erro ao atualizar status: ' + err.message)
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) => toggleAdFeature(id, !current),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
    onError: (err: any) => alert('Erro ao destacar: ' + err.message)
  });

  const toggleVerifyMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) => toggleAdVerification(id, !current),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
    onError: (err: any) => alert('Erro ao verificar: ' + err.message)
  });

  const filteredAds = useMemo(() => {
    if (!adsQuery.data) return [];
    
    return adsQuery.data.filter((ad: any) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
                            ad.title.toLowerCase().includes(term) || 
                            ad.profiles?.name?.toLowerCase().includes(term) ||
                            ad.neighborhood?.toLowerCase().includes(term);
      
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || ad.category === categoryFilter;
      const matchesNeighborhood = neighborhoodFilter === 'all' || ad.neighborhood === neighborhoodFilter;
      const matchesFeatured = featuredFilter === 'all' || (featuredFilter === 'yes' ? ad.is_featured : !ad.is_featured);
      const matchesExternal = externalFilter === 'all' || (externalFilter === 'yes' ? ad.is_external : !ad.is_external);

      return matchesSearch && matchesStatus && matchesCategory && matchesNeighborhood && matchesFeatured && matchesExternal;
    });
  }, [adsQuery.data, searchTerm, statusFilter, categoryFilter, neighborhoodFilter, featuredFilter, externalFilter]);

  if (adsQuery.isLoading && !statsQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Central de Moderação</p>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = (id: string, status: any) => {
    console.log('ADMIN_ACTION: UPDATE_STATUS', { id, status });
    if (status === 'removed' && !window.confirm('Tem certeza que deseja remover este anúncio?')) return;
    updateStatusMutation.mutate({ id, status });
  };

  const handleToggleFeature = (id: string, current: boolean) => {
    console.log('ADMIN_ACTION: TOGGLE_FEATURE', { id, current, next: !current });
    toggleFeatureMutation.mutate({ id, current });
  };

  const handleToggleVerify = (id: string, current: boolean) => {
    console.log('ADMIN_ACTION: TOGGLE_VERIFY', { id, current, next: !current });
    toggleVerifyMutation.mutate({ id, current });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 bg-gray-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase text-primary leading-none mb-1">Tefé Admin</h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", adsQuery.isFetching ? "bg-amber-500 animate-pulse" : "bg-emerald-500")}></span>
                {adsQuery.isFetching ? 'Atualizando dados...' : 'Operação Tefé Market Online'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/novo-anuncio">
            <Button className="flex items-center gap-2 shadow-2xl shadow-primary/30 rounded-2xl px-6 py-4">
              <Package className="w-5 h-5" /> Anúncio Manual
            </Button>
          </Link>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
              queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
            }} 
            variant="outline" 
            className="flex items-center gap-2 bg-white rounded-2xl px-6 py-4 border-gray-100 shadow-sm hover:shadow-md transition-all"
            disabled={adsQuery.isFetching}
          >
            <RefreshCw className={cn("w-5 h-5", adsQuery.isFetching && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </div>

      {(adsQuery.error || statsQuery.error) && (
        <div className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-5 text-red-700 animate-in fade-in slide-in-from-top-6">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black uppercase tracking-widest text-xs mb-1">Falha no Carregamento</p>
            <p className="text-sm font-medium opacity-80">{(adsQuery.error as any)?.message || (statsQuery.error as any)?.message || 'Erro ao sincronizar dados'}</p>
          </div>
        </div>
      )}

      {/* Métrica Cards */}
      {statsQuery.data && (
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-12">
          <StatCard icon={<CheckCircle />} label="Ativos" value={statsQuery.data.active} color="emerald" />
          <StatCard icon={<ShoppingBag />} label="Vendas" value={statsQuery.data.sale} color="indigo" />
          <StatCard icon={<LayoutGrid />} label="Aluguéis" value={statsQuery.data.rent} color="blue" />
          <StatCard icon={<MessageSquare />} label="Serviços" value={statsQuery.data.service} color="purple" />
          <StatCard icon={<Trash2 />} label="Removidos" value={statsQuery.data.removed} color="red" />
          <StatCard icon={<Users />} label="Usuários" value={statsQuery.data.totalUsers} color="amber" />
          <StatCard icon={<TrendingUp />} label="Cliques" value={statsQuery.data.totalClicks} color="primary" />
        </div>
      )}

      {/* Gerenciamento */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Filtros Avançados */}
        <div className="p-8 border-b border-gray-50 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="text" 
                placeholder="Pesquisar por título, usuário, bairro..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-bold placeholder:text-gray-300 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'active', 'sold', 'hidden', 'removed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                    statusFilter === status 
                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105" 
                      : "bg-white border-gray-100 text-gray-400 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {status === 'all' ? 'Todos' : status === 'active' ? 'Ativos' : status === 'sold' ? 'Vendidos' : status === 'hidden' ? 'Ocultos' : 'Removidos'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FilterSelect 
              icon={<LayoutGrid className="w-3 h-3" />}
              label="Categoria"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={['all', ...CATEGORIES]}
            />
            <FilterSelect 
              icon={<Filter className="w-3 h-3" />}
              label="Bairro"
              value={neighborhoodFilter}
              onChange={setNeighborhoodFilter}
              options={['all', ...NEIGHBORHOODS]}
            />
            <FilterSelect 
              icon={<Star className="w-3 h-3" />}
              label="Destaque"
              value={featuredFilter}
              onChange={setFeaturedFilter}
              options={[{v:'all', l:'Todos'}, {v:'yes', l:'Sim'}, {v:'no', l:'Não'}]}
            />
            <FilterSelect 
              icon={<ExternalLink className="w-3 h-3" />}
              label="Tipo"
              value={externalFilter}
              onChange={setExternalFilter}
              options={[{v:'all', l:'Todos'}, {v:'yes', l:'Externos'}, {v:'no', l:'Internos'}]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Anúncio</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Vendedor</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Local / Info</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Preço</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAds.map((ad: any) => (
                <AdTableRow 
                  key={ad.id} 
                  ad={ad} 
                  onUpdateStatus={handleUpdateStatus}
                  onToggleFeature={handleToggleFeature}
                  onToggleVerify={handleToggleVerify}
                  isUpdatingStatus={updateStatusMutation.variables?.id === ad.id && updateStatusMutation.isPending}
                  isUpdatingFeature={toggleFeatureMutation.variables?.id === ad.id && toggleFeatureMutation.isPending}
                  isUpdatingVerify={toggleVerifyMutation.variables?.id === ad.id && toggleVerifyMutation.isPending}
                  activeMutationStatus={updateStatusMutation.variables?.status as any}
                />
              ))}
              {filteredAds.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center bg-gray-50/20">
                    <div className="w-24 h-24 bg-white shadow-xl shadow-gray-200/50 text-gray-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Search className="w-12 h-12" />
                    </div>
                    <h3 className="text-gray-900 font-black text-xl tracking-tight mb-1 uppercase">Nada Encontrado</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tente ajustar seus filtros de moderação</p>
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

const AdTableRow = React.memo(({ 
  ad, 
  onUpdateStatus, 
  onToggleFeature, 
  onToggleVerify, 
  isUpdatingStatus,
  isUpdatingFeature,
  isUpdatingVerify,
  activeMutationStatus
}: { 
  ad: any, 
  onUpdateStatus: (id: string, status: any) => void,
  onToggleFeature: (id: string, current: boolean) => void,
  onToggleVerify: (id: string, current: boolean) => void,
  isUpdatingStatus: boolean,
  isUpdatingFeature: boolean,
  isUpdatingVerify: boolean,
  activeMutationStatus: string | undefined
}) => {
  const handleAction = (action: string, fn: () => void) => {
    console.log(`AD_ACTION_CLICKED: ${action}`, {
      adId: ad.id,
      title: ad.title,
      currentStatus: ad.status,
      isFeatured: ad.is_featured,
      isVerified: ad.is_verified
    });
    fn();
  };

  return (
    <tr className={cn(
      "hover:bg-gray-50/50 transition-all group",
      ad.is_featured && "bg-amber-50/30"
    )}>
      <td className="px-8 py-6">
        <div className="flex items-center gap-5">
          <div className="relative group/img">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md transition-transform group-hover:scale-105">
              {ad.ad_images?.[0]?.image_url ? (
                <img 
                  src={ad.ad_images[0].image_url} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, ad.title)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="w-6 h-6" />
                </div>
              )}
            </div>
            {ad.is_featured && (
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-slow">
                <Star className="w-3 h-3 fill-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-black text-gray-900 text-base line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{ad.title}</div>
              {ad.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Verificado" />}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDate(ad.created_at)}
              </span>
              {ad.is_external && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">Externo</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
             <img 
                src={ad.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.is_external ? ad.external_seller_name || '?' : ad.profiles?.name || 'S')}&background=random`} 
                alt="" 
                className="w-full h-full object-cover"
              />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-gray-900 uppercase tracking-tight line-clamp-1">
              {ad.is_external ? ad.external_seller_name : ad.profiles?.name || 'Sistema'}
            </div>
            {ad.is_external && <div className="text-[9px] text-gray-400 font-medium">{ad.external_seller_phone}</div>}
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="text-xs font-black text-gray-700 mb-1">{ad.neighborhood}</div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ad.category}</div>
      </td>
      <td className="px-6 py-6 text-right">
        <div className="text-base font-black text-primary tracking-tighter">
          {ad.price === 0 ? 'A combinar' : formatPrice(ad.price)}
        </div>
      </td>
      <td className="px-6 py-6 text-center">
        <span className={cn(
          "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm border",
          ad.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
          ad.status === 'sold' ? "bg-blue-50 text-blue-700 border-blue-100" :
          ad.status === 'hidden' ? "bg-amber-50 text-amber-700 border-amber-100" :
          "bg-red-50 text-red-700 border-red-100"
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full",
            ad.status === 'active' ? "bg-emerald-500 animate-pulse" : 
            ad.status === 'sold' ? "bg-blue-500" :
            ad.status === 'hidden' ? "bg-amber-500" : "bg-red-500"
          )}></span>
          {ad.status === 'active' ? 'Ativo' : ad.status === 'sold' ? 'Vendido' : ad.status === 'hidden' ? 'Oculto' : 'Removido'}
        </span>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center justify-end gap-1.5">
          <QuickAction 
            icon={<CheckCircle />} 
            active={ad.status === 'active'}
            onClick={() => handleAction('APPROVE', () => onUpdateStatus(ad.id, 'active'))}
            loading={isUpdatingStatus && activeMutationStatus === 'active'}
            color="emerald"
            title="Ativar / Aprovar"
          />
          <QuickAction 
            icon={<ShoppingBag />} 
            active={ad.status === 'sold'}
            onClick={() => handleAction('MARK_SOLD', () => onUpdateStatus(ad.id, 'sold'))}
            loading={isUpdatingStatus && activeMutationStatus === 'sold'}
            color="blue"
            title="Marcar como Vendido"
          />
          <QuickAction 
            icon={<Eye />} 
            active={ad.status === 'hidden'}
            onClick={() => handleAction('HIDE', () => onUpdateStatus(ad.id, 'hidden'))}
            loading={isUpdatingStatus && activeMutationStatus === 'hidden'}
            color="amber"
            title="Ocultar Anúncio"
          />
          <QuickAction 
            icon={<XCircle />} 
            active={ad.status === 'removed'}
            onClick={() => handleAction('REMOVE', () => onUpdateStatus(ad.id, 'removed'))}
            loading={isUpdatingStatus && activeMutationStatus === 'removed'}
            color="red"
            title="Banir / Remover"
          />
          <div className="w-[1px] h-6 bg-gray-100 mx-1"></div>
          <QuickAction 
            icon={<Star />} 
            active={!!ad.is_featured}
            onClick={() => handleAction('TOGGLE_FEATURE', () => onToggleFeature(ad.id, !!ad.is_featured))}
            loading={isUpdatingFeature}
            color="amber"
            title="Destacar Anúncio"
          />
          <div className="w-[1px] h-6 bg-gray-100 mx-1"></div>
          <QuickAction 
            icon={<BadgeCheck />} 
            active={!!ad.is_verified}
            onClick={() => handleAction('TOGGLE_VERIFY', () => onToggleVerify(ad.id, !!ad.is_verified))}
            loading={isUpdatingVerify}
            color="emerald"
            title="Verificar"
          />
          <div className="w-[1px] h-6 bg-gray-100 mx-1"></div>
          <Link to={`/anuncio/${ad.id}`} target="_blank">
            <button className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-primary ring-1 ring-gray-100 hover:ring-primary/30 rounded-xl transition-all shadow-md active:scale-95" title="Visualizar Anúncio">
              <ExternalLink className="w-4 h-4" />
            </button>
          </Link>
          <Link to={`/admin/editar-anuncio/${ad.id}`}>
            <button className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white hover:bg-black rounded-xl transition-all shadow-lg active:scale-95" title="Editar Anúncio">
              <Edit2 className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
});

const StatCard = React.memo(({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => {
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
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/30 hover:shadow-gray-200/50 transition-all group cursor-default">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110 shadow-sm", colors[color])}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      <div className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2 group-hover:text-primary transition-colors">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">{label}</div>
    </div>
  );
});

const FilterSelect = React.memo(({ icon, label, value, onChange, options }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  onChange: (v: string) => void,
  options: (string | {v:string, l:string})[] 
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 pl-1 flex items-center gap-1.5">
        {icon} {label}
      </label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-primary/20 transition-all text-xs font-black uppercase tracking-tight shadow-sm"
      >
        {options.map(opt => {
          const v = typeof opt === 'string' ? opt : opt.v;
          const l = typeof opt === 'string' ? (opt === 'all' ? 'Tudo' : opt) : opt.l;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
});

const QuickAction = React.memo(({ icon, active, onClick, loading, color, title }: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void, 
  loading: boolean,
  color: 'emerald' | 'blue' | 'amber' | 'red',
  title?: string
}) => {
  const activeColors = {
    emerald: 'bg-emerald-500 text-white shadow-emerald-200 ring-emerald-100',
    blue: 'bg-blue-500 text-white shadow-blue-200 ring-blue-100',
    amber: 'bg-amber-500 text-white shadow-amber-200 ring-amber-100',
    red: 'bg-red-500 text-white shadow-red-200 ring-red-100'
  };

  const hoverColors = {
    emerald: 'hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-200',
    blue: 'hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200',
    amber: 'hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-200',
    red: 'hover:bg-red-50 hover:text-red-600 hover:ring-red-200'
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-md active:scale-90 border-2 border-transparent",
        active 
          ? `${activeColors[color]} scale-105 border-white` 
          : `bg-white text-gray-300 ring-1 ring-gray-100 ${hoverColors[color]}`,
        loading && "animate-pulse"
      )}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
      ) : (
        React.cloneElement(icon as React.ReactElement, { 
          className: cn("w-4 h-4", active && "fill-white") 
        })
      )}
    </button>
  );
});
