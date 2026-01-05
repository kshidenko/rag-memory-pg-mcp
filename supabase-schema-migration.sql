-- Schema Migration: Add missing columns to Supabase tables
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to rag_chunks
ALTER TABLE rag_chunks
ADD COLUMN IF NOT EXISTS start_pos INTEGER,
ADD COLUMN IF NOT EXISTS end_pos INTEGER;

-- 2. Add missing column to rag_entity_embeddings
ALTER TABLE rag_entity_embeddings
ADD COLUMN IF NOT EXISTS embedding_text TEXT;

-- 3. Verify the changes
SELECT 'rag_chunks columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rag_chunks'
ORDER BY ordinal_position;

SELECT 'rag_entity_embeddings columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rag_entity_embeddings'
ORDER BY ordinal_position;
