export const CATEGORIES = [
  'Eletrônicos',
  'Móveis',
  'Veículos',
  'Imóveis',
  'Vestuário',
  'Eletrodomésticos',
  'Ferramentas',
  'Esportes',
  'Serviços',
  'Outros'
];

export const TEFE_NEIGHBORHOODS = [
  "Abial",
  "Aeroporto",
  "Área Rural",
  "Caiambé",
  "Castanheira",
  "Centro",
  "Colônia Ventura",
  "Fonte Boa",
  "Interior / Comunidades",
  "Jardim Lara",
  "Jerusalém",
  "Juruá",
  "Jutaí",
  "Monte Castelo",
  "Mutirão",
  "Nossa Senhora de Fátima",
  "Nova Esperança",
  "Olaria",
  "Outros",
  "Santa Luzia",
  "Santa Rosa",
  "Santo Antônio",
  "São Francisco",
  "São João",
  "São José",
  "São Raimundo",
  "Vila Nova",
];

export const NEIGHBORHOODS = TEFE_NEIGHBORHOODS;

export const FILTER_NEIGHBORHOODS = ["Todos os bairros", ...TEFE_NEIGHBORHOODS];

export const AD_TYPES = [
  { value: 'sale', label: 'Venda' },
  { value: 'rent', label: 'Aluguel' },
  { value: 'service', label: 'Serviços' }
];

export const SERVICE_CATEGORIES = [
  'Diarista',
  'Pedreiro',
  'Encanador',
  'Eletricista',
  'Pintor',
  'Jardineiro',
  'Babá',
  'Manicure',
  'Cabeleireiro',
  'Frete',
  'Mototáxi',
  'Técnico de internet',
  'Outros serviços'
];

export const AD_CONDITIONS = [
  { value: 'new', label: 'Novo' },
  { value: 'used', label: 'Usado' }
];

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=800&auto=format&fit=crop';
