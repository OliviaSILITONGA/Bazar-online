-- ============================================================
-- MIGRATION: Tambah kolom ktm_url ke tabel users
-- Jalankan di Supabase → SQL Editor
-- ============================================================

-- 1. Tambah kolom ktm_url (opsional, null = bukan seller via KTM)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ktm_url TEXT DEFAULT NULL;

-- ============================================================
-- SUPABASE STORAGE: Buat bucket "ktm"
-- Bisa juga dibuat manual via Dashboard → Storage → New Bucket
-- ============================================================
-- Jalankan via Supabase Dashboard → SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('ktm', 'ktm', false)   -- false = private (lebih aman)
ON CONFLICT (id) DO NOTHING;

-- Policy: hanya service role (backend) yang bisa upload
-- (tidak perlu RLS policy tambahan kalau pakai service_role key di backend)

-- ============================================================
-- CATATAN:
-- - is_seller sudah ada di tabel → tidak perlu ALTER
-- - Pastikan SUPABASE_KEY di .env pakai service_role key
--   supaya backend bisa upload ke storage tanpa RLS blocking
-- ============================================================
