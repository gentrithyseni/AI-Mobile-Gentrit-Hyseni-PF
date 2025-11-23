-- Optimizimi i RLS për tabelën 'profiles'

-- 1. Drop policies ekzistuese (për të shmangur konfliktet)
DROP POLICY IF EXISTS "Profiles: select for logged in" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;

-- 2. Krijimi i politikave të optimizuara duke përdorur (select auth.uid())
-- Kjo parandalon thirrjen e funksionit auth.uid() për çdo rresht, duke e ekzekutuar vetëm një herë për query.

CREATE POLICY "Profiles: select for logged in" 
ON public.profiles 
FOR SELECT 
USING ( (select auth.uid()) = id );

CREATE POLICY "Profiles: insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK ( (select auth.uid()) = id );

CREATE POLICY "Profiles: update own" 
ON public.profiles 
FOR UPDATE 
USING ( (select auth.uid()) = id );


-- Optimizimi i RLS për tabelën 'transactions'

-- 1. Drop policies ekzistuese
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- 2. Krijimi i politikave të optimizuara
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING ( (select auth.uid()) = user_id );

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING ( (select auth.uid()) = user_id );

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING ( (select auth.uid()) = user_id );
