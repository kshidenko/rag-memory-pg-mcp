# Security Policy

## 🔒 Reporting Security Issues

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead:
1. Email: kirill@sociaro.com
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

## 🛡️ Security Best Practices

### For Users

**Never commit credentials:**
- ❌ Don't put API keys in code
- ❌ Don't commit `.env` files
- ✅ Use environment variables only
- ✅ Keep `.env` in `.gitignore`

**Protect your keys:**
- Use Supabase **service role key** (not anon key) for MCP
- Keep OpenAI API key private
- Rotate keys if exposed
- Use separate keys for dev/prod

**Database security:**
- Use Row Level Security (RLS) in Supabase
- Limit service key usage to MCP server only
- Don't expose database credentials to frontend

### For Contributors

**Before submitting PR:**
1. Remove all test credentials
2. Check for hardcoded secrets: `git diff`
3. Verify `.env` is not committed
4. Use placeholder values in examples

**Secret scanning:**
```bash
# Check for secrets before commit
git diff | grep -i "sk-\|eyJ\|api[_-]key"
```

## 🔐 Credential Management

### Safe Examples

✅ **In documentation:**
```json
{
  "SUPABASE_URL": "https://your-project.supabase.co",
  "SUPABASE_SERVICE_KEY": "your-service-role-key",
  "OPENAI_API_KEY": "sk-your-api-key"
}
```

✅ **In code:**
```javascript
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('API key required');
}
```

### Unsafe Examples

❌ **Never do this:**
```javascript
// DON'T!
const apiKey = "sk-proj-abc123...";
const supabaseUrl = "https://myproject.supabase.co";
```

## 🚨 What to Do If Exposed

If you accidentally commit credentials:

1. **Immediately rotate the key:**
   - Supabase: Generate new service role key
   - OpenAI: Revoke and create new key

2. **Remove from git history:**
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   # Contact maintainers for help
   ```

3. **Notify:**
   - Email: kirill@sociaro.com
   - Describe what was exposed and for how long

## 🔍 Automated Security

We use:
- GitHub Secret Scanning
- Automated workflows (`.github/workflows/security-check.yml`)
- Pre-commit hooks (recommended)

## 📋 Security Checklist

For each release:
- [ ] No hardcoded credentials
- [ ] All secrets from env vars
- [ ] `.env.example` has placeholders only
- [ ] Documentation uses fake examples
- [ ] Dependencies updated (no known vulnerabilities)
- [ ] Database migrations tested safely

## 🆘 Support

Security questions: kirill@sociaro.com

---

**Stay secure! 🔐**
