-- Politikat e Sigurisë (RLS) për Storage Bucket 'avatars'

-- Sigurohuni që tabela storage.objects ka RLS të aktivizuar (zakonisht është default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Lejo këdo të shikojë fotot e profilit (Public Access)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Lejo përdoruesit e autentifikuar të ngarkojnë foto
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 3. Lejo përdoruesit të përditësojnë fotot e tyre
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- 4. Lejo përdoruesit të fshijnë fotot e tyre
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
