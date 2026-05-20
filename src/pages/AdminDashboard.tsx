import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { fetchAdminStats, fetchAdminAds, updateAdStatus, toggleAdVerification, toggleAdFeature } from '../services/ads';
import { formatPrice, formatDate, cn, handleImageError } from '../lib/utils';
import { CATEGORIES, NEIGHBORHOODS } from '../constants';
import { Shield, Package, AlertTriangle, Eye, Trash2, Edit2, CheckCircle, Clock, TrendingUp, Search, Filter, MessageSquare, LayoutGrid, BadgeCheck, Star, XCircle, ShoppingBag, ExternalLink, RefreshCw, Share2, QrCode } from 'lucide-react';
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
  const [quickFilter, setQuickFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'ads'>('overview');
  const [reportAd, setReportAd] = useState<any | null>(null);

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
      const normalizeText = (value: unknown) => String(value ?? '').toLowerCase();
      const normalizeDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');
      const term = normalizeText(searchTerm.trim());
      const digitTerm = normalizeDigits(searchTerm);
      const searchableValues = [
        ad.title,
        ad.description,
        ad.category,
        ad.neighborhood,
        ad.external_seller_name,
        ad.external_seller_phone,
        ad.profiles?.name,
        ad.profiles?.full_name,
        ad.profiles?.phone,
        ad.profiles?.whatsapp
      ];
      const searchablePhones = [
        ad.external_seller_phone,
        ad.profiles?.phone,
        ad.profiles?.whatsapp
      ];
      const hasImage = Array.isArray(ad.ad_images) && ad.ad_images.some((image: any) => image?.image_url);
      const matchesSearch = !term ||
                            searchableValues.some(value => normalizeText(value).includes(term)) ||
                            (!!digitTerm && searchablePhones.some(value => normalizeDigits(value).includes(digitTerm)));
      
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || ad.category === categoryFilter;
      const matchesNeighborhood = neighborhoodFilter === 'all' || ad.neighborhood === neighborhoodFilter;
      const matchesFeatured = featuredFilter === 'all' || (featuredFilter === 'yes' ? ad.is_featured : !ad.is_featured);
      const matchesExternal = externalFilter === 'all' || (externalFilter === 'yes' ? ad.is_external : !ad.is_external);
      const matchesQuick = quickFilter !== 'no_image' || !hasImage;

      return matchesSearch && matchesStatus && matchesCategory && matchesNeighborhood && matchesFeatured && matchesExternal && matchesQuick;
    });
  }, [adsQuery.data, searchTerm, statusFilter, categoryFilter, neighborhoodFilter, featuredFilter, externalFilter, quickFilter]);

  const dashboardInsights = useMemo(() => {
    const ads = (adsQuery.data || []) as any[];
    const getViews = (ad: any) => Number(ad.views_count ?? ad.views ?? 0) || 0;
    const getWhatsApp = (ad: any) => Number(ad.whatsapp_clicks_count ?? ad.interests ?? 0) || 0;
    const getShares = (ad: any) => Number(ad.shares_count ?? 0) || 0;
    const activeAds = ads.filter(ad => ad.status === 'active');
    const featuredAds = ads.filter(ad => ad.is_featured);
    const normalAds = activeAds.filter(ad => !ad.is_featured);
    const totalViews = ads.reduce((sum, ad) => sum + getViews(ad), 0);
    const totalWhatsApp = ads.reduce((sum, ad) => sum + getWhatsApp(ad), 0);
    const totalShares = ads.reduce((sum, ad) => sum + getShares(ad), 0);
    const average = (items: any[], getter: (ad: any) => number) => {
      if (items.length === 0) return 0;
      return Math.round(items.reduce((sum, ad) => sum + getter(ad), 0) / items.length);
    };
    const featuredAvgViews = average(featuredAds, getViews);
    const normalAvgViews = average(normalAds, getViews);
    const featuredAvgWhatsApp = average(featuredAds, getWhatsApp);
    const normalAvgWhatsApp = average(normalAds, getWhatsApp);
    const viewLift = normalAvgViews > 0 ? Math.round(((featuredAvgViews - normalAvgViews) / normalAvgViews) * 100) : 0;
    const contactLift = normalAvgWhatsApp > 0 ? Math.round(((featuredAvgWhatsApp - normalAvgWhatsApp) / normalAvgWhatsApp) * 100) : 0;

    return {
      activeAds: activeAds.length,
      featuredAds: featuredAds.length,
      normalAds: normalAds.length,
      interestRate: totalViews > 0 ? Math.round((totalWhatsApp / totalViews) * 100) : 0,
      featuredAvgViews,
      normalAvgViews,
      featuredAvgWhatsApp,
      normalAvgWhatsApp,
      viewLift,
      contactLift,
      totalViews,
      totalWhatsApp,
      totalShares,
      topViewed: [...ads].sort((a, b) => getViews(b) - getViews(a)).slice(0, 5),
      topWhatsApp: [...ads].sort((a, b) => getWhatsApp(b) - getWhatsApp(a)).slice(0, 5),
      paidCandidates: activeAds
        .filter(ad => !ad.is_featured)
        .sort((a, b) => (getViews(b) + getWhatsApp(b) * 3) - (getViews(a) + getWhatsApp(a) * 3))
        .slice(0, 4)
    };
  }, [adsQuery.data]);

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
    const confirmations: Record<string, string> = {
      sold: 'Tem certeza que deseja marcar este anuncio como vendido?',
      hidden: 'Tem certeza que deseja ocultar este anuncio?',
      removed: 'Tem certeza que deseja remover este anuncio?'
    };

    if (confirmations[status] && !window.confirm(confirmations[status])) return;
    updateStatusMutation.mutate({ id, status });
  };

  const applyQuickFilter = (filter: string) => {
    setQuickFilter(filter);

    if (['all', 'active', 'sold', 'hidden', 'removed'].includes(filter)) {
      setStatusFilter(filter);
      setExternalFilter('all');
      return;
    }

    if (filter === 'manual') {
      setStatusFilter('all');
      setExternalFilter('yes');
      return;
    }

    if (filter === 'no_image') {
      setStatusFilter('all');
      setExternalFilter('all');
    }
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
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex w-full rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-gray-100 md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all md:flex-none",
              activeTab === 'overview'
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-gray-400 hover:bg-gray-50 hover:text-primary"
            )}
          >
            <TrendingUp className="w-4 h-4" /> Visao Geral
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all md:flex-none",
              activeTab === 'ads'
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-gray-400 hover:bg-gray-50 hover:text-primary"
            )}
          >
            <Package className="w-4 h-4" /> Anuncios
          </button>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {activeTab === 'overview' ? 'Indicadores comerciais' : `${filteredAds.length} anuncios encontrados`}
        </div>
      </div>

      {activeTab === 'overview' && statsQuery.data && (
        <div className="space-y-8">
          <div className="grid gap-4 lg:grid-cols-4">
            <CommercialMetric
              icon={<QrCode />}
              label="QR Cartao"
              value={statsQuery.data.qrCartao ?? 0}
              detail={`${statsQuery.data.qrUnicos ?? 0} visitantes unicos`}
              color="blue"
            />
            <CommercialMetric
              icon={<TrendingUp />}
              label="Alcance"
              value={statsQuery.data.totalViews ?? dashboardInsights.totalViews}
              detail={`${dashboardInsights.activeAds} anuncios ativos`}
              color="purple"
            />
            <CommercialMetric
              icon={<MessageSquare />}
              label="Contatos"
              value={statsQuery.data.totalWhatsAppClicks ?? statsQuery.data.totalClicks ?? dashboardInsights.totalWhatsApp}
              detail={`${dashboardInsights.interestRate}% taxa de interesse`}
              color="emerald"
            />
            <CommercialMetric
              icon={<Star />}
              label="Destaques"
              value={dashboardInsights.featuredAds}
              detail={`${dashboardInsights.paidCandidates.length} candidatos a plano pago`}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
            <StatCard icon={<Package />} label="Total" value={statsQuery.data.total ?? 0} color="primary" />
            <StatCard icon={<CheckCircle />} label="Ativos" value={statsQuery.data.active} color="emerald" />
            <StatCard icon={<ShoppingBag />} label="Vendidos" value={statsQuery.data.sold ?? 0} color="indigo" />
            <StatCard icon={<Eye />} label="Ocultos" value={statsQuery.data.hidden ?? 0} color="amber" />
            <StatCard icon={<Trash2 />} label="Removidos" value={statsQuery.data.removed} color="red" />
            <StatCard icon={<ExternalLink />} label="Manuais" value={statsQuery.data.external ?? 0} color="blue" />
            <StatCard icon={<Share2 />} label="Compart." value={statsQuery.data.totalShares ?? dashboardInsights.totalShares} color="indigo" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PaidComparisonPanel
              icon={<Eye />}
              title="Media de visualizacoes"
              featuredValue={dashboardInsights.featuredAvgViews}
              normalValue={dashboardInsights.normalAvgViews}
              lift={dashboardInsights.viewLift}
              suffix="views por anuncio"
            />
            <PaidComparisonPanel
              icon={<MessageSquare />}
              title="Media de contatos"
              featuredValue={dashboardInsights.featuredAvgWhatsApp}
              normalValue={dashboardInsights.normalAvgWhatsApp}
              lift={dashboardInsights.contactLift}
              suffix="cliques por anuncio"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <RankingPanel
              title="Mais vistos"
              icon={<Eye />}
              ads={dashboardInsights.topViewed}
              metric={(ad) => ad.views_count ?? ad.views ?? 0}
              suffix="views"
            />
            <RankingPanel
              title="Mais contatos"
              icon={<MessageSquare />}
              ads={dashboardInsights.topWhatsApp}
              metric={(ad) => ad.whatsapp_clicks_count ?? ad.interests ?? 0}
              suffix="cliques"
            />
            <RankingPanel
              title="Potencial pago"
              icon={<Star />}
              ads={dashboardInsights.paidCandidates}
              metric={(ad) => (ad.views_count ?? ad.views ?? 0) + (ad.whatsapp_clicks_count ?? ad.interests ?? 0) * 3}
              suffix="pontos"
            />
          </div>
        </div>
      )}

      {/* Gerenciamento */}
      {activeTab === 'ads' && (
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Filtros Avançados */}
        <div className="p-8 border-b border-gray-50 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="text" 
                placeholder="Pesquisar por titulo, descricao, categoria, bairro, vendedor ou telefone..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-bold placeholder:text-gray-300 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Ativos' },
                { value: 'sold', label: 'Vendidos' },
                { value: 'hidden', label: 'Ocultos' },
                { value: 'removed', label: 'Removidos' },
                { value: 'manual', label: 'Manuais' },
                { value: 'no_image', label: 'Sem imagem' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => applyQuickFilter(filter.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                    quickFilter === filter.value
                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105" 
                      : "bg-white border-gray-100 text-gray-400 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {filter.label}
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
              onChange={(value) => {
                setExternalFilter(value);
                if (quickFilter === 'manual') setQuickFilter('all');
              }}
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
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-gray-400">Local / Metricas</th>
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
                  onOpenReport={setReportAd}
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
      )}
      {reportAd && (
        <AdReportModal ad={reportAd} onClose={() => setReportAd(null)} />
      )}
    </div>
  );
}

const AdTableRow = React.memo(({ 
  ad, 
  onUpdateStatus, 
  onToggleFeature, 
  onToggleVerify, 
  onOpenReport,
  isUpdatingStatus,
  isUpdatingFeature,
  isUpdatingVerify,
  activeMutationStatus
}: { 
  ad: any, 
  onUpdateStatus: (id: string, status: any) => void,
  onToggleFeature: (id: string, current: boolean) => void,
  onToggleVerify: (id: string, current: boolean) => void,
  onOpenReport: (ad: any) => void,
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

  const profileData = Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles;
  const primaryImage = Array.isArray(ad.ad_images) ? ad.ad_images.find((image: any) => image?.image_url) : null;
  const sellerName = ad.is_external
    ? ad.external_seller_name || 'Anunciante manual'
    : profileData?.name || profileData?.full_name || 'Sistema';
  const sellerPhone = ad.is_external
    ? ad.external_seller_phone
    : profileData?.whatsapp || profileData?.phone;
  const viewsCount = ad.views_count ?? ad.views ?? 0;
  const whatsappClicksCount = ad.whatsapp_clicks_count ?? ad.interests ?? 0;
  const sharesCount = ad.shares_count ?? 0;
  const price = Number(ad.price ?? 0);

  return (
    <tr className={cn(
      "hover:bg-gray-50/50 transition-all group",
      ad.is_featured && "bg-amber-50/30"
    )}>
      <td className="px-8 py-6">
        <div className="flex items-center gap-5">
          <div className="relative group/img">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md transition-transform group-hover:scale-105">
              {primaryImage?.image_url ? (
                <img 
                  src={primaryImage.image_url} 
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
              <div className="font-black text-gray-900 text-base line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{ad.title || 'Sem titulo'}</div>
              {ad.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Verificado" />}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDate(ad.created_at)}
              </span>
              {ad.is_external && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">Manual</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
             <img 
                src={profileData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName || 'S')}&background=random`} 
                alt="" 
                className="w-full h-full object-cover"
              />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-gray-900 uppercase tracking-tight line-clamp-1">
              {sellerName}
            </div>
            <div className="text-[9px] text-gray-400 font-medium">{sellerPhone || 'Sem telefone'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="text-xs font-black text-gray-700 mb-1">{ad.neighborhood || 'Bairro nao informado'}</div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">{ad.category || 'Sem categoria'}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[9px] font-black text-gray-500" title="Visualizacoes">
            <Eye className="w-3 h-3" /> {viewsCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700" title="Cliques WhatsApp">
            <MessageSquare className="w-3 h-3" /> {whatsappClicksCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[9px] font-black text-indigo-700" title="Compartilhamentos">
            <Share2 className="w-3 h-3" /> {sharesCount}
          </span>
        </div>
      </td>
      <td className="px-6 py-6 text-right">
        <div className="text-base font-black text-primary tracking-tighter">
          {price === 0 ? 'A combinar' : formatPrice(price)}
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
          <button
            onClick={() => onOpenReport(ad)}
            className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-purple-600 ring-1 ring-gray-100 hover:ring-purple-200 rounded-xl transition-all shadow-md active:scale-95"
            title="Relatorio do Anuncio"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
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

const AdReportModal = React.memo(({ ad, onClose }: { ad: any, onClose: () => void }) => {
  const views = Number(ad.views_count ?? ad.views ?? 0) || 0;
  const whatsapp = Number(ad.whatsapp_clicks_count ?? ad.interests ?? 0) || 0;
  const shares = Number(ad.shares_count ?? 0) || 0;
  const interestRate = views > 0 ? Math.round((whatsapp / views) * 100) : 0;
  const isStrongCandidate = !ad.is_featured && ad.status === 'active' && (views >= 10 || whatsapp >= 1);
  const suggestion = ad.is_featured
    ? 'Este anuncio ja esta destacado. Use estes numeros para renovar ou vender um pacote maior.'
    : isStrongCandidate
      ? 'Bom candidato para destaque: ja recebeu atencao e pode gerar mais contatos com prioridade.'
      : 'Ainda precisa ganhar tracao. Melhorar foto, titulo ou divulgar por QR antes de vender destaque.';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-4 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Relatorio do anuncio</p>
            <h2 className="truncate text-2xl font-black tracking-tight text-gray-950">{ad.title || 'Sem titulo'}</h2>
            <p className="mt-1 text-xs font-bold text-gray-400">{ad.category || 'Sem categoria'} · {ad.neighborhood || 'Bairro nao informado'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Fechar"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-4">
          <ReportMetric icon={<Eye />} label="Visualizacoes" value={views} color="gray" />
          <ReportMetric icon={<MessageSquare />} label="WhatsApp" value={whatsapp} color="emerald" />
          <ReportMetric icon={<Share2 />} label="Compart." value={shares} color="indigo" />
          <ReportMetric icon={<TrendingUp />} label="Interesse" value={interestRate} suffix="%" color="purple" />
        </div>

        <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Status comercial</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest",
                ad.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                ad.status === 'sold' ? "bg-blue-100 text-blue-700" :
                ad.status === 'hidden' ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>
                {ad.status === 'active' ? 'Ativo' : ad.status === 'sold' ? 'Vendido' : ad.status === 'hidden' ? 'Oculto' : 'Removido'}
              </span>
              {ad.is_featured && <span className="rounded-xl bg-amber-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">Destacado</span>}
              {ad.is_external && <span className="rounded-xl bg-blue-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">Manual</span>}
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-5 text-amber-900">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-700">Sugestao</p>
            <p className="text-sm font-bold leading-relaxed">{suggestion}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <Link to={`/anuncio/${ad.id}`} target="_blank">
            <Button variant="outline" className="flex items-center gap-2 rounded-2xl bg-white">
              <ExternalLink className="h-4 w-4" /> Ver anuncio
            </Button>
          </Link>
          <button
            onClick={onClose}
            className="rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-black"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
});

const ReportMetric = React.memo(({ icon, label, value, suffix = '', color }: {
  icon: React.ReactNode,
  label: string,
  value: number,
  suffix?: string,
  color: string
}) => {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-500',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-xl", colors[color])}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
      </div>
      <div className="text-2xl font-black tracking-tighter text-gray-950">{value}{suffix}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</div>
    </div>
  );
});

const CommercialMetric = React.memo(({ icon, label, value, detail, color }: {
  icon: React.ReactNode,
  label: string,
  value: number,
  detail: string,
  color: string
}) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500 text-white shadow-emerald-200',
    blue: 'bg-blue-500 text-white shadow-blue-200',
    purple: 'bg-purple-500 text-white shadow-purple-200',
    amber: 'bg-amber-500 text-white shadow-amber-200',
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-2xl shadow-gray-200/30">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
          <div className="text-4xl font-black tracking-tighter text-gray-950 leading-none">{value}</div>
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", colors[color])}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
      </div>
      <p className="text-xs font-bold text-gray-500">{detail}</p>
    </div>
  );
});

const PaidComparisonPanel = React.memo(({ icon, title, featuredValue, normalValue, lift, suffix }: {
  icon: React.ReactNode,
  title: string,
  featuredValue: number,
  normalValue: number,
  lift: number,
  suffix: string
}) => {
  const maxValue = Math.max(featuredValue, normalValue, 1);
  const featuredWidth = Math.max(8, Math.round((featuredValue / maxValue) * 100));
  const normalWidth = Math.max(8, Math.round((normalValue / maxValue) * 100));
  const liftText = lift > 0 ? `+${lift}%` : `${lift}%`;

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-2xl shadow-gray-200/30">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Comparativo de destaque</p>
          <h2 className="text-lg font-black text-gray-950 tracking-tight">{title}</h2>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
      </div>

      <div className="space-y-5">
        <ComparisonRow label="Destacados" value={featuredValue} width={featuredWidth} suffix={suffix} active />
        <ComparisonRow label="Comuns" value={normalValue} width={normalWidth} suffix={suffix} />
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-amber-800">
        <div className="text-xl font-black tracking-tighter">{liftText}</div>
        <p className="text-[10px] font-black uppercase tracking-widest">vantagem media dos destacados</p>
      </div>
    </div>
  );
});

const ComparisonRow = React.memo(({ label, value, width, suffix, active = false }: {
  label: string,
  value: number,
  width: number,
  suffix: string,
  active?: boolean
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <span className={cn("text-xs font-black", active ? "text-amber-600" : "text-gray-500")}>{value} {suffix}</span>
    </div>
    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={cn("h-full rounded-full", active ? "bg-amber-500" : "bg-gray-300")}
        style={{ width: `${width}%` }}
      />
    </div>
  </div>
));

const RankingPanel = React.memo(({ title, icon, ads, metric, suffix }: {
  title: string,
  icon: React.ReactNode,
  ads: any[],
  metric: (ad: any) => number,
  suffix: string
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-2xl shadow-gray-200/30 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
            {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
          </div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {ads.length > 0 ? ads.map((ad, index) => (
          <Link
            key={ad.id || index}
            to={`/anuncio/${ad.id}`}
            target="_blank"
            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-black text-gray-900 truncate">{index + 1}. {ad.title || 'Sem titulo'}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{ad.category || 'Sem categoria'}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-black text-primary leading-none">{Number(metric(ad) || 0)}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-300">{suffix}</div>
            </div>
          </Link>
        )) : (
          <div className="px-6 py-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Sem dados ainda</p>
          </div>
        )}
      </div>
    </div>
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
