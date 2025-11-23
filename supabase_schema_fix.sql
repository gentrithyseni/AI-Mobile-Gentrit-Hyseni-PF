-- Shto kolonat e munguara në tabelën 'profiles'

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Sigurohu që RLS është aktivizuar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Rifresko cache-in e skemës në Supabase (nganjëherë duhet bërë manualisht në dashboard te Settings -> API -> Refresh Schema)
