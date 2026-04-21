import { Ad } from '../types';

export const MOCK_ADS: Ad[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'iPhone 13 Pro Max - 256GB',
    description: 'iPhone em estado de novo, sem marcas de uso. Acompanha caixa e carregador original.',
    price: 4500,
    category: 'Eletrônicos',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Centro',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i1', ad_id: '1', image_url: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '2',
    user_id: 'user2',
    title: 'Aluguel de Betoneira 400L',
    description: 'Betoneira em ótimo estado para sua obra. Entrega grátis no centro.',
    price: 80,
    category: 'Casa',
    ad_type: 'rent',
    condition: 'used',
    neighborhood: 'Abial',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i2', ad_id: '2', image_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '3',
    user_id: 'user3',
    title: 'Moto Honda Biz 125 2022',
    description: 'Único dono, apenas 5000km rodados. Documentação em dia.',
    price: 12000,
    category: 'Veículos',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Japiim',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i3', ad_id: '3', image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '4',
    user_id: 'user1',
    title: 'Notebook Dell Inspiron 15',
    description: 'Intel Core i5, 8GB RAM, 256GB SSD. Ideal para estudos e trabalho.',
    price: 2800,
    category: 'Eletrônicos',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Centro',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i4', ad_id: '4', image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '5',
    user_id: 'user4',
    title: 'Serviço de Formatação e Limpeza',
    description: 'Formatação de PCs e Notebooks, instalação de drivers e limpeza preventiva.',
    price: 100,
    category: 'Serviços',
    ad_type: 'sale',
    condition: 'new',
    neighborhood: 'Jerusalém',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i5', ad_id: '5', image_url: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '6',
    user_id: 'user2',
    title: 'Smart TV Samsung 50" 4K',
    description: 'TV na garantia, pouco uso. Acompanha controle remoto e base.',
    price: 2100,
    category: 'Eletrônicos',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Santa Teresa',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i6', ad_id: '6', image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '7',
    user_id: 'user5',
    title: 'Tênis Nike Air Max - Original',
    description: 'Tamanho 40, cor preta. Quase novo, usado apenas 2 vezes.',
    price: 350,
    category: 'Roupas',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Bacu',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i7', ad_id: '7', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '8',
    user_id: 'user3',
    title: 'Geladeira Duplex Consul',
    description: '400 litros, funcionando perfeitamente. Motivo: mudança.',
    price: 1500,
    category: 'Casa',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Japiim',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i8', ad_id: '8', image_url: 'https://images.unsplash.com/photo-1571175432291-fe50e0503f8e?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '9',
    user_id: 'user4',
    title: 'Bicicleta Aro 29 Groove',
    description: '24 marchas, freio a disco hidráulico. Excelente para trilhas.',
    price: 1800,
    category: 'Esportes',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Jerusalém',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i9', ad_id: '9', image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  },
  {
    id: '10',
    user_id: 'user1',
    title: 'Caixa de Som JBL Boombox 2',
    description: 'Som potente, bateria dura até 24h. À prova d\'água.',
    price: 1200,
    category: 'Eletrônicos',
    ad_type: 'sale',
    condition: 'used',
    neighborhood: 'Centro',
    status: 'active',
    created_at: new Date().toISOString(),
    ad_images: [
      { id: 'i10', ad_id: '10', image_url: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0, created_at: new Date().toISOString() }
    ]
  }
];
