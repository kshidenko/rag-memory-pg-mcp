# Migration Guide: Complete RAG Memory Setup

## 🚨 Issue Found

The Supabase database tables are missing some columns needed for the new features:

**rag_chunks** missing:
- `start_pos` (INTEGER)
- `end_pos` (INTEGER)

**rag_entity_embeddings** missing:
- `embedding_text` (TEXT)

## ✅ Solution: 2-Step Process

### Step 1: Update Supabase Schema

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/qystmdysjemiqlqmhfbh
   - Navigate to: SQL Editor

2. **Run the migration SQL:**
   ```sql
   -- Add missing columns to rag_chunks
   ALTER TABLE rag_chunks
   ADD COLUMN IF NOT EXISTS start_pos INTEGER,
   ADD COLUMN IF NOT EXISTS end_pos INTEGER;

   -- Add missing column to rag_entity_embeddings
   ALTER TABLE rag_entity_embeddings
   ADD COLUMN IF NOT EXISTS embedding_text TEXT;
   ```

3. **Verify the changes:**
   ```sql
   -- Check rag_chunks columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'rag_chunks'
   ORDER BY ordinal_position;

   -- Check rag_entity_embeddings columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'rag_entity_embeddings'
   ORDER BY ordinal_position;
   ```

### Step 2: Run Data Migration

After the schema is updated, run the migration script:

```bash
cd /Users/kirillshidenko/cursor-workspace/rag-memory-pg-mcp
node migrate-all-data.js
```

This will:
- ✅ Chunk all 277 documents
- ✅ Generate embeddings for all chunks
- ✅ Generate embeddings for all 555 entities

**Estimated time:** 10-15 minutes

## 📋 Quick Reference

### Current Database State

**Before migration:**
- ✅ 555 entities
- ✅ 765 relationships
- ✅ 277 documents
- ❌ 0 chunks (schema needs update)
- ❌ 0 entity embeddings (schema needs update)

**After migration:**
- ✅ 555 entities
- ✅ 765 relationships
- ✅ 277 documents
- ✅ ~2,000-3,000 chunks (estimated)
- ✅ 555 entity embeddings

### Tools Status

**All 20 tools implemented:**
- ✅ Code complete
- ⚠️ Waiting for schema migration
- ⚠️ Waiting for data migration

## 🔧 Alternative: Manual Schema Update

If you prefer, you can also update the schema using Supabase client:

```javascript
// This won't work directly - needs to be run as admin SQL
// Use the SQL Editor method above instead
```

## 📝 Files Created

1. **supabase-schema-migration.sql** - SQL migration script
2. **migrate-all-data.js** - Data migration script
3. **MIGRATION_GUIDE.md** - This guide

## 🚀 After Migration

Once both steps are complete:

1. **Restart Cursor** to load the updated MCP server
2. **Test new features:**
   - `embedAllEntities` - Semantic entity search
   - `chunkDocument` - Document processing
   - `embedChunks` - Chunk embeddings
   - `getDetailedContext` - Advanced search

## ⚠️ Important Notes

- **Schema changes are permanent** - Make sure you're ready
- **Migration is one-way** - Chunks will be created fresh
- **Embeddings take time** - ~10-15 minutes for all data
- **Model download** - First run downloads Hugging Face model (~50MB)

## 🆘 Troubleshooting

**If migration fails:**
1. Check Supabase connection
2. Verify schema changes applied
3. Check console for specific errors
4. Can re-run migration safely (idempotent)

**If embeddings fail:**
1. Check internet connection (model download)
2. Check available memory (model needs ~500MB)
3. Can run in batches if needed

---

**Status:** ⚠️ Waiting for schema migration
**Next Action:** Run SQL in Supabase SQL Editor
**Version:** 2.0.0
**Date:** October 6, 2025
