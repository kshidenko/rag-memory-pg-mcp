# GitHub Repository Setup

## 🔒 Branch Protection Rules

To prevent unauthorized merges and maintain code quality, configure branch protection:

### Steps to Enable:

1. **Go to Settings:**
   - Navigate to: https://github.com/kshidenko/rag-memory-pg-mcp/settings/branches

2. **Add Branch Protection Rule:**
   - Click "Add rule"
   - Branch name pattern: `main`

3. **Configure Protection:**

   ✅ **Required:**
   - [x] Require a pull request before merging
   - [x] Require approvals: `1` (maintainer must approve)
   - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require status checks to pass before merging
     - [x] Require branches to be up to date before merging
     - Status checks: `check-secrets` (from security-check.yml)
   - [x] Require conversation resolution before merging
   - [x] Do not allow bypassing the above settings

   ⚠️ **Optional but Recommended:**
   - [x] Require signed commits
   - [x] Include administrators (even you need PRs)
   - [x] Restrict pushes that create matching branches

4. **Restrict who can push:**
   - [x] Restrict who can push to matching branches
   - Add: `kshidenko` (you, as maintainer)
   - Result: **Only you can merge PRs**, others must submit PRs

5. **Save Changes**

## 🛡️ Additional Security Settings

### 1. Enable Security Features

Go to: https://github.com/kshidenko/rag-memory-pg-mcp/settings/security_analysis

Enable:
- [x] Dependency graph
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Secret scanning (GitHub will detect leaked keys)
- [x] Push protection (prevents pushing secrets)

### 2. Configure Code Scanning

Go to: https://github.com/kshidenko/rag-memory-pg-mcp/settings/security_analysis

- [x] Enable CodeQL analysis
- Select: JavaScript/TypeScript

### 3. Set Repository Visibility

If not already:
- Visibility: **Public** ✅
- Ensure no secrets in any files

## 👥 Collaborator Management

### Adding Collaborators

Settings → Collaborators → Add people

**Permissions:**
- `Read`: Can view and clone
- `Triage`: Can manage issues/PRs
- `Write`: Can push (but protected branches still require PR)
- `Maintain`: Can manage releases
- `Admin`: Full access

**Recommendation:** 
- Most contributors: `Read` only (submit PRs)
- Trusted maintainers: `Maintain` or `Admin`

## 📋 Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Checklist
- [ ] No secrets/credentials committed
- [ ] Tests pass locally
- [ ] Code follows project style
- [ ] Documentation updated

## Testing
<!-- How did you test this? -->
```

## 🏷️ Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug
---

## Bug Description
<!-- Clear description -->

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- Node version:
- OS:
- Package version:
```

## 🤖 GitHub Actions Workflows

Already configured:
- ✅ `.github/workflows/security-check.yml` - Secret scanning

**Future additions:**
- Unit tests workflow
- NPM publish workflow
- Release automation

## 📊 Repository Insights

Useful pages:
- **Insights → Traffic**: See who's viewing
- **Insights → Network**: Visualize forks
- **Insights → Dependency graph**: View dependencies
- **Security → Advisories**: Security alerts

## 🔑 Personal Access Token (for NPM publish)

When ready to publish:

1. Create token: https://github.com/settings/tokens
2. Scopes needed:
   - `repo` (for GitHub releases)
3. Add to NPM: `npm login`
4. Store securely (not in repo!)

## ✅ Verification

After setup:
1. Try pushing directly to `main` → Should fail
2. Create test PR → Should require review
3. GitHub Actions should run on PR
4. Secret scanning should work

---

**Setup complete!** 🎉 Your repository is now protected.
