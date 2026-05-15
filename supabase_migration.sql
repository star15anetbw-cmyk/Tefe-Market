-- SCRIPT DE MIGRAÇÃO SUPABASE - PRODUÇÃO
-- Este script adiciona a coluna de destaque e configura permissões administrativas seguras.

-- 0. POLÍTICAS PARA PROFILES E TRIGGER DE CRIAÇÃO AUTOMÁTICA
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Função disparada quando um novo usuário se cadastra (OAuth ou Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1. ADICIONAR COLUNA IS_FEATURED (IDEMPOTENTE)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ads' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE ads ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. POLÍTICA DE ATUALIZAÇÃO PARA ADMINS NA TABELA ADS
-- Remove políticas antigas que podem conflitar
DROP POLICY IF EXISTS "Admins can update any ad" ON ads;
CREATE POLICY "Admins can update any ad" 
ON ads 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Permissão total para Admins na tabela ads (Insert, Select, Delete)
DROP POLICY IF EXISTS "Admins have full access to ads" ON ads;
CREATE POLICY "Admins have full access to ads" 
ON ads 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 3. POLÍTICAS PARA AD_IMAGES
DROP POLICY IF EXISTS "Admins have full access to ad_images" ON ad_images;
CREATE POLICY "Admins have full access to ad_images" 
ON ad_images 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. POLÍTICAS DE STORAGE PARA BUCKET 'ad-images'
-- O Supabase usa a tabela storage.objects para gerenciar o acesso aos arquivos.
DROP POLICY IF EXISTS "Admins full access to ad-images bucket" ON storage.objects;
CREATE POLICY "Admins full access to ad-images bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'ad-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'ad-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. TABELA DE CLICKS (ESTATÍSTICAS)
CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'whatsapp', 'view', etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir RLS habilitado
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Política para inserção pública (rastrear cliques)
DROP POLICY IF EXISTS "Anyone can track clicks" ON ad_clicks;
CREATE POLICY "Anyone can track clicks" ON ad_clicks FOR INSERT WITH CHECK (true);

-- Política para visualização apenas Admin
DROP POLICY IF EXISTS "Only admins can view click stats" ON ad_clicks;
CREATE POLICY "Only admins can view click stats" ON ad_clicks FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

