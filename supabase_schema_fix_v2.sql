-- Shto kolonën 'updated_at' në tabelën 'profiles'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Rifresko cache-in e skemës në Supabase
NOTIFY pgrst, 'reload schema';
