# Contributing to RAG Memory PostgreSQL MCP

Thank you for your interest in contributing! 🎉

## 📋 How to Contribute

We welcome contributions via **Pull Requests (PRs)**. All changes must be reviewed and approved by maintainers before merging.

### Process

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR-USERNAME/rag-memory-pg-mcp.git
   cd rag-memory-pg-mcp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-improvement
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test locally**
   ```bash
   npm install
   # Set your test credentials in .env (not committed)
   node test-openai-embeddings.js
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   git push origin feature/your-improvement
   ```

6. **Open a Pull Request**
   - Go to https://github.com/kshidenko/rag-memory-pg-mcp
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes clearly

## 🔒 Branch Protection

- **Direct pushes to `main` are disabled** for non-maintainers
- All changes must go through PR review
- Maintainers will review and merge approved PRs

## 🎯 Areas for Contribution

### High Priority
- Additional embedding providers (Cohere, Azure OpenAI, etc.)
- Performance optimizations
- Better error handling
- More comprehensive tests

### Documentation
- Usage examples
- Tutorial videos
- API documentation improvements

### Bug Fixes
- Check [Issues](https://github.com/kshidenko/rag-memory-pg-mcp/issues)
- Reproduce and fix bugs
- Add regression tests

## 📝 Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Cohere embeddings provider
fix: resolve connection timeout issue
docs: update README with examples
chore: update dependencies
test: add unit tests for embeddings
```

## 🚫 What NOT to Do

- ❌ Don't commit API keys, secrets, or credentials
- ❌ Don't push directly to `main` branch
- ❌ Don't include personal/sensitive data
- ❌ Don't submit PRs with breaking changes without discussion

## ✅ Code Quality

- Use clear, descriptive variable names
- Add docstrings for public functions
- Follow existing code style (see existing files)
- Keep functions small and focused
- Add comments for complex logic

## 🧪 Testing

Before submitting PR:
```bash
# Test with local embeddings
EMBEDDING_PROVIDER=LOCAL node test-openai-embeddings.js

# Test with OpenAI (if you have key)
EMBEDDING_PROVIDER=OPENAI OPENAI_API_KEY=sk-... node test-openai-embeddings.js
```

## 📞 Questions?

- Open an [Issue](https://github.com/kshidenko/rag-memory-pg-mcp/issues) for discussion
- Check existing issues first
- Be respectful and constructive

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping improve RAG Memory PostgreSQL MCP!** 🙏
