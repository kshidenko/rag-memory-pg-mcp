# Update Guide

## Automatic Updates (Recommended)

### For npx users (most common)

If you're using the recommended `npx` configuration with `@latest`:

```json
{
  "command": "npx",
  "args": ["-y", "rag-memory-pg-mcp@latest"]
}
```

**npx automatically:**
- Checks for updates every 24 hours
- Downloads new versions when available
- No manual action needed ✅

### Force immediate update

To force an immediate update, simply:

1. **Restart your IDE** (Cursor, Claude Desktop, etc.)
2. **Or clear npx cache:**
   ```bash
   npx clear-npx-cache
   ```

---

## Manual Update Methods

### Method 1: Reinstall via npx (Easiest)

```bash
# Clear cache
npx clear-npx-cache

# Restart your IDE
# Cursor will download latest version automatically
```

### Method 2: Update global installation

If installed globally:

```bash
npm update -g rag-memory-pg-mcp
```

### Method 3: Check current vs latest version

```bash
# Check installed version
npm list -g rag-memory-pg-mcp

# Check latest available
npm view rag-memory-pg-mcp version

# Update if needed
npm install -g rag-memory-pg-mcp@latest
```

---

## How npx @latest Works

When you use `rag-memory-pg-mcp@latest`:

1. **First run:** Downloads and caches the latest version
2. **Subsequent runs:** Uses cached version for 24 hours
3. **After 24h:** Automatically checks npm registry for updates
4. **If newer:** Downloads and uses new version
5. **If same:** Continues with cached version

This means:
- ✅ Always up-to-date within 24 hours
- ✅ No manual updates needed
- ✅ Fast startup (uses cache)
- ✅ Automatic version management

---

## Checking Your Version

### In your IDE logs

Look for startup message:
```
🚀 Initializing RAG Memory PostgreSQL MCP Server...
Version: 2.0.0
```

### Via npm

```bash
npm view rag-memory-pg-mcp version
```

### Via package manager

```bash
# Check what npx will use
npx rag-memory-pg-mcp@latest --version 2>&1 | grep -i version || echo "Check package.json"
```

---

## Troubleshooting Updates

### "Still seeing old version after restart"

1. Clear npx cache:
   ```bash
   npx clear-npx-cache
   ```

2. Kill old processes:
   ```bash
   pkill -f rag-memory-pg-mcp
   ```

3. Restart IDE completely

### "Want to pin to specific version"

Use exact version instead of `@latest`:

```json
{
  "command": "npx",
  "args": ["-y", "rag-memory-pg-mcp@2.0.0"]
}
```

**Not recommended:** You'll miss bug fixes and improvements.

---

## Version History

Check releases: https://github.com/kshidenko/rag-memory-pg-mcp/releases

See changelog: [CHANGELOG.md](CHANGELOG.md)

---

## Best Practices

✅ **Do:**
- Use `@latest` in your config
- Let npx handle updates automatically
- Check changelog for breaking changes
- Restart IDE after major updates

❌ **Don't:**
- Pin to old versions
- Skip reading migration guides
- Forget to update after breaking changes

---

**For most users, `@latest` + IDE restart = always up to date!** 🚀
