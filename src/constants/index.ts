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
  "Castanheira",
  "Centro",
  "Colônia Ventura",
  "Fonte Boa",
  "Juruá",
  "Jutaí",
  "Monte Castelo",
  "Mutirão",
  "Nossa Senhora de Fátima",
  "Olaria",
  "Santa Luzia",
  "Santo Antônio",
  "São Francisco",
  "São João",
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
