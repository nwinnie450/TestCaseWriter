# 🔒 Security Guide - API Keys & Sensitive Information

This guide explains how to properly handle API keys and sensitive information in the Test Case Manager application to ensure security and prevent accidental exposure.

## 🚨 **CRITICAL: Never Commit API Keys to Version Control**

API keys, passwords, and other sensitive information should **NEVER** be committed to Git repositories. This includes:
- OpenAI API keys
- Claude API keys
- Database credentials
- Authentication tokens
- Private keys
- Any other secrets or credentials

## 📁 **Protected Files & Directories**

The following files and directories are automatically ignored by Git (see `.gitignore`):

### Environment Files
```
.env
.env.local
.env.development
.env.production
.env.test
```

### API Key Files
```
api-keys.json
api-keys.local.json
config/secrets.json
config/api-keys.json
secrets/
*.key
*.secret
*.token
```

### Security Directories
```
credentials/
auth/
tokens/
secrets/
```

### User Configuration
```
user-config.json
user-settings.json
local-settings.json
```

## 🔧 **How to Set Up API Keys Securely**

### Option 1: Environment Variables (Recommended)

1. **Create a `.env.local` file** in your project root:
   ```bash
   # .env.local (DO NOT COMMIT THIS FILE)
   OPENAI_API_KEY=your_openai_api_key_here
   CLAUDE_API_KEY=your_claude_api_key_here
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_jwt_secret_here
   ```

2. **Access in your code**:
   ```typescript
   // src/lib/ai-providers.ts
   const openaiApiKey = process.env.OPENAI_API_KEY
   const claudeApiKey = process.env.CLAUDE_API_KEY
   
   if (!openaiApiKey) {
     throw new Error('OPENAI_API_KEY environment variable is required')
   }
   ```

3. **Verify the file is ignored**:
   ```bash
   git status
   # .env.local should NOT appear in the output
   ```

### Option 2: Configuration Files (Alternative)

1. **Create a `config/api-keys.local.json` file**:
   ```json
   {
     "openai": {
       "apiKey": "your_openai_api_key_here"
     },
     "claude": {
       "apiKey": "your_claude_api_key_here"
     }
   }
   ```

2. **Access in your code**:
   ```typescript
   // src/lib/config.ts
   import apiKeys from '../config/api-keys.local.json'
   
   export const getOpenAIApiKey = () => {
     return apiKeys.openai.apiKey
   }
   ```

3. **Ensure the file is ignored**:
   ```bash
   # Check if it's ignored
   git check-ignore config/api-keys.local.json
   # Should return: config/api-keys.local.json
   ```

## 🚫 **What NOT to Do**

### ❌ **Never do this:**
```typescript
// BAD: Hardcoding API keys
const API_KEY = 'sk-1234567890abcdef'
const OPENAI_KEY = 'sk-openai-key-here'

// BAD: Committing .env files
git add .env
git commit -m "Add API keys"

// BAD: Adding secrets to version control
git add config/secrets.json
git add api-keys.json
```

### ❌ **Avoid these patterns:**
- Hardcoding API keys in source code
- Committing `.env` files
- Adding `secrets/` directories to Git
- Including API keys in documentation
- Sharing API keys in public repositories

## ✅ **What TO Do**

### ✅ **Good practices:**
```typescript
// GOOD: Using environment variables
const apiKey = process.env.OPENAI_API_KEY

// GOOD: Validation
if (!apiKey) {
  throw new Error('API key not configured')
}

// GOOD: Using configuration files (ignored by Git)
import config from '../config/api-keys.local.json'
```

### ✅ **Security checklist:**
- [ ] Use `.env.local` for local development
- [ ] Use `.env.production` for production (set by deployment platform)
- [ ] Never commit environment files
- [ ] Validate required environment variables on startup
- [ ] Use strong, unique API keys
- [ ] Rotate API keys regularly
- [ ] Monitor API key usage

## 🔍 **Verifying Security**

### Check what's being tracked by Git:
```bash
# See all tracked files
git ls-files

# Check for any files that might contain secrets
git ls-files | grep -E '\.(env|key|secret|token|pem|p12|pfx)$'

# Check if .env files are ignored
git check-ignore .env.local
git check-ignore .env
```

### Verify .gitignore is working:
```bash
# Try to add a protected file
echo "API_KEY=test" > test-key.env
git add test-key.env

# Should show the file is ignored
git status
# test-key.env should NOT appear in the output
```

## 🚨 **If You Accidentally Commit Secrets**

### Immediate actions:
1. **Revoke the exposed API key immediately**
2. **Generate a new API key**
3. **Remove the file from Git history**:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/secret/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. **Force push to remote**:
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

### Prevention:
- Use pre-commit hooks to check for secrets
- Implement automated security scanning
- Regular security audits of your codebase

## 📚 **Additional Resources**

### Security Tools:
- **GitGuardian**: Automated secret detection
- **TruffleHog**: Searches for secrets in Git history
- **Pre-commit hooks**: Prevent commits with secrets

### Best Practices:
- **OWASP**: Web application security
- **GitHub Security**: Repository security best practices
- **12 Factor App**: Environment configuration

## 🆘 **Need Help?**

If you discover a security issue:
1. **Don't panic** - act quickly but carefully
2. **Revoke compromised credentials immediately**
3. **Document the incident** for future prevention
4. **Review and update security practices**

## 📝 **Summary**

- ✅ Use environment variables (`.env.local`)
- ✅ Keep API keys in ignored files
- ✅ Validate configuration on startup
- ❌ Never hardcode secrets
- ❌ Never commit `.env` files
- ❌ Never share API keys publicly

Remember: **Security is everyone's responsibility**. When in doubt, ask for help rather than risking exposure of sensitive information. 