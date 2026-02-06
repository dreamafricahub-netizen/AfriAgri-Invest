-- =====================================================
-- Script de création du bucket "proofs" pour Supabase
-- À exécuter dans SQL Editor de Supabase
-- =====================================================

-- 1. Créer le bucket "proofs" pour stocker les preuves de paiement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proofs',
  'proofs',
  true,  -- Bucket public pour permettre l'accès aux images
  5242880,  -- Limite de 5MB (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. Politique pour permettre la lecture publique des images
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'proofs');

-- 3. Politique pour permettre l'insertion via service role
CREATE POLICY "Allow service role insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proofs');

-- 4. Politique pour permettre la suppression via service role
CREATE POLICY "Allow service role delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'proofs');
