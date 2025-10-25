# CareLink .gitignore Configuration

This document explains the `.gitignore` files created for the CareLink project to ensure sensitive data, dependencies, and build artifacts are not committed to version control.

## 📁 File Structure

```
carelink/
├── .gitignore                 # Main project gitignore
├── backend/
│   └── .gitignore            # Backend-specific gitignore
└── env.example               # Environment variables template
```

## 🔒 What's Excluded

### Frontend (Next.js)
- `node_modules/` - Dependencies
- `.next/` - Next.js build output
- `out/` - Static export output
- `build/` - Production build
- `dist/` - Distribution files

### Backend (Python/FastAPI)
- `venv/` - Python virtual environment
- `__pycache__/` - Python bytecode cache
- `*.pyc`, `*.pyo`, `*.pyd` - Compiled Python files
- `.env` - Environment variables with secrets

### Sensitive Data
- `.env` files containing API keys
- `*.key`, `*.pem` - SSL certificates
- `secrets/` - Secret files directory
- Database files (`*.db`, `*.sqlite`)

### Development Files
- IDE configurations (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)
- Temporary files (`tmp/`, `temp/`)

### CareLink Specific
- `agent_data/` - Fetch.ai agent data
- `agent_logs/` - Agent execution logs
- `vapi_logs/` - Vapi voice call logs
- `brightdata_cache/` - Bright Data cache
- `ngrok.yml`, `ngrok.log` - ngrok configuration

## 🚀 Getting Started

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your API keys in `.env`:**
   ```bash
   # Required for full functionality
   VAPI_API_KEY=your_vapi_api_key_here
   BRIGHTDATA_USERNAME=your_username
   BRIGHTDATA_PASSWORD=your_password
   FETCHAI_SEED_PHRASE=your_seed_phrase
   ```

3. **Backend environment:**
   ```bash
   cp backend/env.example backend/.env
   ```

## ⚠️ Security Notes

- **Never commit `.env` files** - They contain sensitive API keys
- **Use `env.example`** as a template for required variables
- **Rotate API keys** regularly in production
- **Use different keys** for development and production

## 🔧 Customization

To add project-specific exclusions, edit the relevant `.gitignore` file:

- **Root level**: `/Users/alvintran/calhacks12/carelink/.gitignore`
- **Backend**: `/Users/alvintran/calhacks12/carelink/backend/.gitignore`

## 📋 Environment Variables

See `env.example` for a complete list of required environment variables:

- **Frontend**: Next.js public variables
- **Backend**: FastAPI configuration
- **APIs**: Vapi, Bright Data, Fetch.ai
- **Security**: JWT secrets, encryption keys
- **External**: Google Maps, Twilio

## 🛡️ Best Practices

1. **Always use `.env` files** for configuration
2. **Never hardcode secrets** in source code
3. **Use different environments** (dev/staging/prod)
4. **Regularly audit** what's being committed
5. **Use environment-specific** `.gitignore` rules

## 🚨 Common Mistakes to Avoid

- ❌ Committing `node_modules/`
- ❌ Including `.env` files
- ❌ Adding API keys to source code
- ❌ Committing database files
- ❌ Including build artifacts
- ❌ Adding IDE-specific files

## 📞 Support

If you need to add additional exclusions or have questions about the gitignore configuration, refer to:

- [Git Documentation](https://git-scm.com/docs/gitignore)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Python .gitignore](https://github.com/github/gitignore/blob/main/Python.gitignore)
