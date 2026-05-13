-- SCHEMA: Tefé Market - Fase 2
-- Descrição: Modelagem inicial do banco de dados para o MVP.

-- 1. ENUMS E TIPOS CUSTOMIZADOS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN
        CREATE TYPE ad_status AS ENUM ('active', 'sold', 'hidden', 'removed');
    END IF;
END $$;

-- Garantir que 'removed' exista se o tipo já foi criado anteriormente
ALTER TYPE ad_status ADD VALUE IF NOT EXISTS 'removed';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_condition') THEN
        CREATE TYPE ad_condition AS ENUM ('new', 'used');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_type') THEN
        CREATE TYPE ad_type AS ENUM ('sale', 'rent');
    END IF;
END $$;

-- 2. TABELA DE PERFIS (Extensão de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    whatsapp TEXT,
    neighborhood TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user', -- 'user' ou 'admin'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE ANÚNCIOS
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    condition ad_condition DEFAULT 'used',
    ad_type ad_type DEFAULT 'sale',
    status ad_status DEFAULT 'active',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    interests INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE IMAGENS DOS ANÚNCIOS
CREATE TABLE IF NOT EXISTS public.ad_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ÍNDICES ESSENCIAIS
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON public.ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_category ON public.ads(category);
CREATE INDEX IF NOT EXISTS idx_ad_images_ad_id ON public.ad_images(ad_id);

-- 6. FUNÇÃO E TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER tr_ads_updated_at
    BEFORE UPDATE ON public.ads
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- 7. CRIAÇÃO AUTOMÁTICA DE PERFIL (Estratégia Anti-Órfãos)
-- Esta função cria um registro em public.profiles automaticamente
-- disparada por um evento no schema 'auth' (auth.users).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, whatsapp, neighborhood)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name', 
            'Usuário ' || split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
        COALESCE(NEW.raw_user_meta_data->>'neighborhood', 'Tefé')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Logar o erro se possível ou apenas ignorar para não travar o login do auth
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado APÓS a criação do usuário no Supabase Auth
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_images ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS PARA PROFILES
-- Qualquer perfil é visível publicamente (necessário para ver informações do vendedor)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Usuários podem inserir seu próprio perfil durante o cadastro
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar apenas os próprios dados cadastrais
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 9. POLÍTICAS PARA ADS
-- Qualquer visitante pode ver anúncios com status 'active'
CREATE POLICY "Public ads are viewable by everyone"
ON public.ads FOR SELECT
USING (status = 'active');

-- Usuários podem ver todos os seus próprios anúncios (incluindo vendidos ou ocultos)
CREATE POLICY "Users can view their own ads"
ON public.ads FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver TODOS os anúncios
CREATE POLICY "Admins can view all ads"
ON public.ads FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admins podem gerenciar TODOS os anúncios
CREATE POLICY "Admins can manage all ads"
ON public.ads FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Usuários podem criar anúncios (o user_id deve ser o próprio ID)
CREATE POLICY "Users can insert their own ads"
ON public.ads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas anúncios que criaram
CREATE POLICY "Users can update their own ads"
ON public.ads FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem excluir apenas anúncios que criaram
CREATE POLICY "Users can delete their own ads"
ON public.ads FOR DELETE
USING (auth.uid() = user_id);

-- 10. POLÍTICAS PARA AD_IMAGES
-- Imagens são públicas se o anúncio for público ou se o usuário for o dono
CREATE POLICY "Public images are viewable by everyone"
ON public.ad_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.ads
        WHERE ads.id = ad_images.ad_id
        AND (ads.status = 'active' OR ads.user_id = auth.uid())
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admins podem gerenciar todas as imagens
CREATE POLICY "Admins can manage all ad images"
ON public.ad_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Usuários podem inserir imagens apenas em anúncios que possuem
CREATE POLICY "Users can insert images to their own ads"
ON public.ad_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.ads
        WHERE ads.id = ad_id
        AND ads.user_id = auth.uid()
    )
);

-- Usuários podem excluir imagens apenas de anúncios que possuem
CREATE POLICY "Users can delete images of their own ads"
ON public.ad_images FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.ads
        WHERE ads.id = ad_id
        AND ads.user_id = auth.uid()
    )
);

-- 11. CONFIGURAÇÃO DE STORAGE (IMAGES)
-- 12. TABELA DE FAVORITOS
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, ad_id)
);

-- Habilitar RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_ad_id ON public.favorites(ad_id);

-- 13. TABELA DE CLIQUES (TRACKING)
CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'whatsapp', etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Clicks are insertable by everyone" 
ON public.ad_clicks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Clicks viewable by admins" 
ON public.ad_clicks FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON public.ad_clicks(ad_id);

-- 14. CONFIGURAÇÃO DE STORAGE (IMAGES)
-- Bucket Público: Imagens de anúncios são acessíveis via URL pública sem necessidade de token.
-- IMPORTANTE: No Supabase, buckets marcados como 'public' ignoram políticas de SELECT para leitura via URL de objeto. 
-- As políticas de RLS abaixo controlam apenas operações via API/SDK (listagem e escrita).
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Permite listagem via SDK para usuários autenticados (opcional para o frontend)
CREATE POLICY "Ad images listable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ad-images');

-- Política: Upload Restrito (Double Check Ownership)
-- Convenção: ad-images/{user_id}/{ad_id}/{filename}
CREATE POLICY "Users can upload ad images to their own space"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'ad-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.ads
        WHERE ads.id::text = (storage.foldername(name))[2]
        AND ads.user_id = auth.uid()
    )
);

-- Política: Atualização Restrita (Garante que só o dono substitui o arquivo)
CREATE POLICY "Users can update their own ad images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'ad-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'ad-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.ads
        WHERE ads.id::text = (storage.foldername(name))[2]
        AND ads.user_id = auth.uid()
    )
);

-- Política: Exclusão Restrita
CREATE POLICY "Users can delete their own ad images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'ad-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
