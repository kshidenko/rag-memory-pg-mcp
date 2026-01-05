# Migration Guide

## v1.x → v2.0.0 (Latest)

### ⚠️ BREAKING CHANGE: Environment Variable Renamed

**Old:**
```bash
EMBEDDING_PROVIDER=OPENAI  # ❌ Deprecated
```

**New:**
```bash
MODE=openai  # ✅ Use this instead
```

**Migration:**
Simply rename the environment variable in your config:
- `EMBEDDING_PROVIDER=LOCAL` → `MODE=local`
- `EMBEDDING_PROVIDER=OPENAI` → `MODE=openai`

**Why?** Simpler, clearer, more intuitive. MODE is lowercase for consistency.

---

## v1.1.0 → v1.2.0

## What's New in v1.2.0

### OpenAI Embeddings Support (Optional)

You can now choose between **local** (privacy-focused) or **OpenAI** (fast, cloud-based) embeddings.

## ✅ Full Backward Compatibility

**No migration needed!** Both embedding providers:
- Generate **384-dimensional vectors**
- Store in the same PostgreSQL schema
- Use identical vector search algorithms
- Are fully interchangeable

### Your Options

1. **Keep using local embeddings** (default) - no changes needed
2. **Switch to OpenAI** - just add env vars, all existing data remains valid
3. **Mix both** - can switch providers anytime without breaking existing embeddings

## Performance Comparison

| Feature | Local (HuggingFace) | OpenAI |
|---------|---------------------|--------|
| Speed | Slower (CPU-based) | **10-100x faster** |
| Cost | Free | ~$0.02/1M tokens |
| Privacy | Complete (offline) | Cloud-based |
| Setup | Zero config | API key required |
| Resources | ~50MB model + CPU | None |

## How to Switch to OpenAI

### Update your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rag-memory": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

### Restart Cursor

That's it! All existing embeddings continue to work.

## Technical Details

Both providers produce normalized 384-dimensional vectors stored as `vector(384)` in PostgreSQL:

```sql
-- Same schema for both providers
CREATE TABLE rag_chunks (
  ...
  embedding VECTOR(384),  -- Works with both LOCAL and OPENAI
  ...
);
```

**Vector similarity search works identically:**
```sql
-- Same query for both
SELECT * FROM rag_chunks 
ORDER BY embedding <-> $query_vector 
LIMIT 10;
```

## Fallback Behavior

If `EMBEDDING_PROVIDER=OPENAI` but `OPENAI_API_KEY` is missing:
- Automatically falls back to LOCAL
- Logs warning in console
- Continues working normally

## When to Use Which

**Use LOCAL if:**
- Privacy is critical
- Working with sensitive data
- Want zero ongoing costs
- Don't mind slower performance

**Use OPENAI if:**
- Need fast embeddings (large documents)
- Processing many documents
- Want minimal local resource usage
- Have budget for API costs

## Cost Estimation (OpenAI)

- **1,000 documents** (~500 words each): ~$0.01
- **10,000 documents**: ~$0.10
- **100,000 documents**: ~$1.00

Most use cases: **< $1/month**

## Questions?

Open an issue: https://github.com/kshidenko/rag-memory-pg-mcp/issues
