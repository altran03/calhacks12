# CareLink .gitignore Configuration

This document explains the updated `.gitignore` files for the refactored CareLink project structure.

## 📁 Updated File Structure

```
calhacks12/
├── .gitignore                 # Root level gitignore
├── frontend/
│   ├── .gitignore            # Frontend-specific gitignore
│   ├── node_modules/         # Excluded
│   ├── .next/               # Excluded
│   └── .env.local           # Excluded
├── backend/
│   ├── .gitignore            # Backend-specific gitignore
│   ├── venv/                # Excluded
│   ├── __pycache__/         # Excluded
│   └── .env                 # Excluded
└── env.example              # Template file
```

## 🔒 What's Excluded

### Root Level (`.gitignore`)
- **Frontend artifacts**: `frontend/node_modules/`, `frontend/.next/`, `frontend/.env.local`
- **Backend artifacts**: `backend/venv/`, `backend/__pycache__/`, `backend/.env`
- **Environment files**: `.env`, `.env.local`, `.env.*.local`
- **IDE files**: `.vscode/`, `.idea/`, `*.swp`
- **OS files**: `.DS_Store`, `Thumbs.db`
- **Logs and temp files**: `logs/`, `tmp/`, `*.log`
- **API keys and secrets**: `*.key`, `*.pem`, `secrets/`
- **Database files**: `*.db`, `*.sqlite`
- **Service-specific**: `vapi_logs/`, `brightdata_cache/`, `agent_data/`

### Frontend (`.gitignore`)
- **Dependencies**: `node_modules/`
- **Build outputs**: `.next/`, `out/`, `build/`, `dist/`
- **Environment**: `.env.local`, `.env`
- **Cache files**: `*.tsbuildinfo`, `.eslintcache`
- **IDE files**: `.vscode/`, `.idea/`
- **OS files**: `.DS_Store`, `Thumbs.db`
- **Mapbox**: `mapbox-gl.css`

### Backend (`.gitignore`)
- **Python artifacts**: `__pycache__/`, `*.pyc`, `venv/`
- **Environment**: `.env`
- **Testing**: `.pytest_cache/`, `coverage/`, `htmlcov/`
- **Logs**: `*.log`, `uvicorn.log`, `fastapi.log`
- **Database**: `*.db`, `*.sqlite`
- **Secrets**: `*.key`, `*.pem`, `secrets/`
- **Agent data**: `agent_data/`, `agent_logs/`, `agent_wallets/`

## 🚀 Key Changes from Refactor

### ✅ **Removed Old Structure**
- ❌ `carelink/node_modules/` (old nested structure)
- ❌ `carelink/backend/venv/` (old nested structure)
- ❌ `carelink/.next/` (old nested structure)

### ✅ **Added New Structure**
- ✅ `frontend/node_modules/` (new frontend directory)
- ✅ `backend/venv/` (new backend directory)
- ✅ `frontend/.env.local` (Mapbox token)
- ✅ `backend/.pytest_cache/` (testing artifacts)

## 🔧 Environment Setup

### Frontend Environment
```bash
# Copy template
cp frontend/env.local.example frontend/.env.local

# Add your Mapbox token
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_token" >> frontend/.env.local
```

### Backend Environment
```bash
# Copy template
cp backend/env.example backend/.env

# Add your API keys
echo "VAPI_API_KEY=your_key" >> backend/.env
echo "BRIGHTDATA_USERNAME=your_username" >> backend/.env
```

## ⚠️ Security Notes

- **Never commit `.env` files** - They contain sensitive API keys
- **Use `env.example`** as templates for required variables
- **Mapbox tokens** should be in `frontend/.env.local`
- **Backend secrets** should be in `backend/.env`
- **Rotate API keys** regularly in production

## 🛡️ Best Practices

1. **Always use `.env` files** for configuration
2. **Never hardcode secrets** in source code
3. **Use different environments** (dev/staging/prod)
4. **Regularly audit** what's being committed
5. **Use environment-specific** `.gitignore` rules

## 📋 Verification

To verify your `.gitignore` is working:

```bash
# Check what would be committed
git status

# Check what's being ignored
git status --ignored

# Test with a sample file
echo "test" > frontend/.env.local
git status  # Should not show .env.local
rm frontend/.env.local
```

## 🚨 Common Mistakes to Avoid

- ❌ Committing `node_modules/` or `venv/`
- ❌ Including `.env` files
- ❌ Adding API keys to source code
- ❌ Committing database files
- ❌ Including build artifacts
- ❌ Adding IDE-specific files

The `.gitignore` files are now properly configured for the refactored frontend/backend structure! 🎉