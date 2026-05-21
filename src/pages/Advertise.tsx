import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Target,
  Users
} from 'lucide-react';
import Button from '../components/ui/Button';
import { registerTrafficEvent } from '../services/traffic';

const benefits = [
  {
    icon: MapPin,
    title: 'Alcance local',
    description: 'Seu anuncio aparece para pessoas procurando produtos e servicos em Tefe.'
  },
  {
    icon: MessageCircle,
    title: 'Contato direto',
    description: 'O comprador fala com voce pelo WhatsApp, sem intermediarios.'
  },
  {
    icon: BarChart3,
    title: 'Mais visibilidade',
    description: 'Destaques pagos ajudam bons anuncios a ficarem mais evidentes na vitrine.'
  }
];

const plans = [
  {
    name: 'Gratis',
    price: 'R$ 0',
    period: 'publicacao simples',
    description: 'Para vender um item, divulgar um servico ou testar o Tefe Market.',
    features: ['Aparece na listagem', 'Contato direto pelo WhatsApp', 'Edicao pelo painel do anunciante'],
    featured: false
  },
  {
    name: 'Destaque 7 dias',
    price: 'R$ 25',
    period: 'por anuncio',
    description: 'Bom para ofertas rapidas, promocoes e itens com giro curto.',
    features: ['Selo de destaque', 'Prioridade visual na home', 'Ideal para campanhas curtas'],
    featured: false
  },
  {
    name: 'Destaque 15 dias',
    price: 'R$ 45',
    period: 'por anuncio',
    description: 'Equilibrio entre alcance, tempo de exposicao e custo.',
    features: ['Mais tempo na vitrine', 'Maior chance de contato', 'Boa opcao para servicos locais'],
    featured: true
  },
  {
    name: 'Destaque 30 dias',
    price: 'R$ 75',
    period: 'por anuncio',
    description: 'Para negocios que querem presenca constante durante o mes.',
    features: ['Exposicao prolongada', 'Melhor para lojas e prestadores', 'Ajuda a reforcar marca local'],
    featured: false
  },
  {
    name: 'Parceiro local',
    price: 'Sob consulta',
    period: 'pacote mensal',
    description: 'Para lojas, servicos e marcas que querem uma presenca mais forte no Tefe Market.',
    features: ['Destaques combinados', 'Apoio comercial', 'Ideal para divulgacao recorrente'],
    featured: false
  }
];

const steps = [
  'Crie sua conta gratuita',
  'Publique seu produto ou servico',
  'Receba contatos pelo WhatsApp',
  'Ative um destaque quando quiser vender mais rapido'
];

const proofPoints = [
  {
    icon: Target,
    title: 'Venda para quem esta perto',
    description: 'O Tefe Market organiza a procura local por bairro, categoria e tipo de anuncio.'
  },
  {
    icon: Store,
    title: 'Bom para comercio local',
    description: 'Lojas, autonomos e prestadores podem transformar estoque e agenda em vitrine digital.'
  },
  {
    icon: ShieldCheck,
    title: 'Experiencia mais confiavel',
    description: 'Anuncios com dados claros, imagens e contato direto ajudam o comprador a decidir mais rapido.'
  }
];

const faqs = [
  {
    question: 'Preciso pagar para anunciar?',
    answer: 'Nao. A publicacao simples e gratuita. Os destaques pagos sao opcionais para quem quer mais visibilidade.'
  },
  {
    question: 'O Tefe Market recebe pagamento da venda?',
    answer: 'Nao. O contato acontece direto entre comprador e anunciante, normalmente pelo WhatsApp informado no anuncio.'
  },
  {
    question: 'Quando vale a pena destacar?',
    answer: 'Vale quando o item tem urgencia, quando o servico precisa aparecer mais, ou quando a loja quer reforcar presenca na cidade.'
  },
  {
    question: 'Posso divulgar servicos?',
    answer: 'Sim. Alem de produtos, o Tefe Market tambem aceita anuncios de servicos locais.'
  }
];

export default function Advertise() {
  const didRegisterView = React.useRef(false);

  React.useEffect(() => {
    if (didRegisterView.current) return;

    didRegisterView.current = true;
    registerTrafficEvent('pagina_anunciar');
  }, []);

  const trackCommercialClick = (origem: string) => {
    registerTrafficEvent(origem, '/anunciar');
  };

  return (
    <div className="min-h-screen bg-bg-main overflow-x-hidden">
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary mb-5">
                <Megaphone className="w-4 h-4" />
                Anuncie em Tefe
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-950 leading-[0.95]">
                Venda mais com o Tefe Market
              </h1>
              <p className="mt-6 text-base sm:text-lg font-semibold text-gray-500 leading-relaxed max-w-2xl">
                Publique gratis, fale direto com compradores pelo WhatsApp e use destaques pagos quando quiser colocar seu anuncio na frente de mais pessoas.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/publicar" onClick={() => trackCommercialClick('cta_planos_publicar')}>
                  <Button size="lg" className="w-full sm:w-auto gap-2 rounded-2xl">
                    Publicar anuncio <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/cadastro" onClick={() => trackCommercialClick('cta_planos_cadastro')}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-2xl">
                    Criar conta gratis
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] bg-gray-950 p-6 sm:p-8 text-white shadow-2xl shadow-gray-900/20 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Vitrine local</p>
                    <h2 className="text-2xl font-black mt-1">Destaque pago</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <Users className="w-5 h-5 text-secondary mb-3" />
                    <p className="text-2xl font-black">Local</p>
                    <p className="text-xs font-bold text-white/55 mt-1">publico de Tefe</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <Clock className="w-5 h-5 text-secondary mb-3" />
                    <p className="text-2xl font-black">7-30</p>
                    <p className="text-xs font-bold text-white/55 mt-1">dias de destaque</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white text-gray-950 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Star className="w-7 h-7 text-primary fill-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-black">Anuncio em evidencia</p>
                      <p className="text-sm font-semibold text-gray-500 mt-1">
                        Perfeito para lojistas, prestadores de servico e vendas com urgencia.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-14">
        <section className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <benefit.icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-gray-950">{benefit.title}</h2>
              <p className="mt-2 text-sm font-semibold text-gray-500 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Planos</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 mt-2">Comece gratis. Destaque quando fizer sentido.</h2>
            </div>
            <p className="text-sm font-semibold text-gray-500 max-w-md">
              Valores simples para vender a ideia com clareza e testar demanda local antes de criar pacotes maiores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-2xl border p-6 bg-white shadow-sm ${
                  plan.featured ? 'border-primary ring-4 ring-primary/10' : 'border-gray-100'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                    Mais indicado
                  </div>
                )}
                <h3 className="text-lg font-black text-gray-950">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-black text-gray-950">{plan.price}</span>
                  <span className="ml-2 text-xs font-bold uppercase tracking-widest text-gray-400">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-500 leading-relaxed min-h-[4rem]">{plan.description}</p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm font-bold text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {proofPoints.map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-gray-950 leading-tight">{item.title}</h2>
              </div>
              <p className="text-sm font-semibold text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center bg-gray-950 rounded-[2rem] p-6 sm:p-10 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">Como funciona</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Uma jornada simples para anunciar melhor.</h2>
            <p className="mt-4 text-sm sm:text-base font-semibold text-white/60 leading-relaxed">
              A primeira venda pode comecar no gratis. Depois, os destaques viram argumento comercial para quem quer aparecer mais.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                <div className="w-9 h-9 rounded-xl bg-white text-gray-950 flex items-center justify-center text-sm font-black mb-4">
                  {index + 1}
                </div>
                <p className="font-black leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary mb-4">
              <HelpCircle className="w-4 h-4" />
              Duvidas comuns
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950">
              Menos duvida, mais anuncio publicado.
            </h2>
            <p className="mt-4 text-sm sm:text-base font-semibold text-gray-500 leading-relaxed">
              Respostas simples para quem ainda esta decidindo se vale a pena anunciar ou investir em destaque.
            </p>
          </div>

          <div className="grid gap-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-base font-black text-gray-950">{faq.question}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] border border-gray-100 p-6 sm:p-10 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
                <BadgeCheck className="w-7 h-7 text-secondary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950">Pronto para colocar seu negocio na vitrine?</h2>
              <p className="mt-3 text-sm sm:text-base font-semibold text-gray-500 max-w-2xl">
                Publique o primeiro anuncio sem custo e use os planos de destaque para transformar visibilidade em contatos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/publicar" onClick={() => trackCommercialClick('cta_planos_publicar_final')}>
                <Button size="lg" className="w-full sm:w-auto gap-2 rounded-2xl">
                  Publicar agora
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-2xl">
                  Ver anuncios
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
