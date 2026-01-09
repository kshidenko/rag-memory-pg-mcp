-- Full-Text Search Setup for rag-memory-pg-mcp
-- Run this in Supabase SQL Editor for better search performance
--
-- This adds tsvector column with GIN index for fast full-text search.
-- After running this, hybridSearch will automatically use FTS instead of ilike.

-- ============================================================
-- 1. Add tsvector column to rag_documents
-- ============================================================
ALTER TABLE rag_documents 
ADD COLUMN IF NOT EXISTS content_tsv tsvector;

-- ============================================================
-- 2. Create GIN index for fast search
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rag_documents_content_tsv 
ON rag_documents USING GIN (content_tsv);

-- ============================================================
-- 3. Create function to update tsvector on insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION rag_documents_update_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_tsv := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Create trigger for automatic updates
-- ============================================================
DROP TRIGGER IF EXISTS rag_documents_tsv_trigger ON rag_documents;
CREATE TRIGGER rag_documents_tsv_trigger
  BEFORE INSERT OR UPDATE OF content ON rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION rag_documents_update_tsv();

-- ============================================================
-- 5. Update existing documents (one-time backfill)
-- ============================================================
UPDATE rag_documents 
SET content_tsv = to_tsvector('english', COALESCE(content, ''))
WHERE content_tsv IS NULL;

-- ============================================================
-- 6. Verify setup
-- ============================================================
SELECT 
  'FTS Setup Complete!' as status,
  COUNT(*) as total_documents,
  COUNT(content_tsv) as documents_with_tsv
FROM rag_documents;

-- ============================================================
-- Optional: Add same for rag_chunks (for chunk-level search)
-- ============================================================
-- ALTER TABLE rag_chunks ADD COLUMN IF NOT EXISTS content_tsv tsvector;
-- CREATE INDEX IF NOT EXISTS idx_rag_chunks_content_tsv ON rag_chunks USING GIN (content_tsv);
-- ... (same trigger pattern)
