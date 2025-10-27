# 🗄️ Migration from Supabase to Local PostgreSQL

This document explains how CareLink has been migrated from Supabase to a local PostgreSQL database for better control, privacy, and development flexibility.

## 🔄 What Changed

### **Before (Supabase)**
- Cloud-hosted PostgreSQL database
- External API dependencies
- Internet connection required
- Monthly costs for usage
- Limited control over database

### **After (Local PostgreSQL)**
- Local PostgreSQL database
- No external dependencies
- Works offline
- No ongoing costs
- Full control over database

## 📁 New Files Created

### **Database Module**
- `local_database.py` - Main database module replacing Supabase
- `init_database.py` - Database initialization with sample data
- `migrate_to_local_postgres.py` - Migration script (already run)

### **Configuration**
- `env.local.example` - Environment variables template
- `setup_local_postgres.sh` - Automated setup script

## 🚀 Quick Setup

### **1. Install PostgreSQL**

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

### **2. Run Setup Script**
```bash
cd backend
./setup_local_postgres.sh
```

### **3. Manual Setup (Alternative)**

If the automated script doesn't work:

```bash
# 1. Create .env file
cp env.local.example .env

# 2. Edit .env with your database credentials
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DB=carelink
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=password

# 3. Install dependencies
pip3 install -r requirements.txt

# 4. Initialize database
python3 init_database.py

# 5. Start the application
python3 main.py
```

## 🗄️ Database Schema

The local PostgreSQL database includes these tables:

### **Core Tables**
- `cases` - Patient case information
- `workflows` - Workflow status and progress
- `shelters` - Shelter information with coordinates
- `transport` - Transportation options
- `benefits` - Benefits programs (Medi-Cal, SNAP, etc.)
- `resources` - Community resources

### **Sample Data**
The initialization script populates the database with:
- 5 sample shelters in San Francisco
- 5 transport options (including accessible options)
- 5 benefits programs
- 5 community resources

## 🔧 Environment Variables

Create a `.env` file with these variables:

```env
# Local PostgreSQL Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=carelink
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# API Keys (keep your existing ones)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VAPI_API_KEY=your_vapi_api_key_here
BRIGHTDATA_API_KEY=your_brightdata_api_key_here
```

## 📊 Database Operations

### **Connection Management**
- Uses connection pooling for better performance
- Automatic connection cleanup
- Error handling and fallbacks

### **Data Operations**
All Supabase functions have been replaced with local equivalents:

| Supabase Function | Local PostgreSQL Function |
|------------------|---------------------------|
| `save_form_draft()` | `save_form_draft()` |
| `get_form_draft()` | `get_form_draft()` |
| `list_form_drafts()` | `list_form_drafts()` |
| `delete_form_draft()` | `delete_form_draft()` |
| `save_workflow()` | `save_workflow()` |
| `get_workflow()` | `get_workflow()` |
| `list_workflows()` | `list_workflows()` |

### **New Functions**
- `get_shelters()` - Get all shelters
- `get_transport_options()` - Get transport options
- `get_benefits_programs()` - Get benefits programs
- `get_community_resources()` - Get community resources
- `update_shelter_availability()` - Update shelter capacity

## 🔍 Verification

### **Check Database Connection**
```bash
python3 -c "from local_database import local_db; print('✅ Database connected' if local_db.connection_pool else '❌ Database not connected')"
```

### **Check Sample Data**
```bash
python3 -c "from local_database import get_shelters; print(f'Shelters: {len(get_shelters())}')"
```

### **Test API Endpoints**
```bash
# Start the server
python3 main.py

# Test in another terminal
curl http://localhost:8000/api/shelters
curl http://localhost:8000/api/transport-options
curl http://localhost:8000/api/benefits-programs
```

## 🐛 Troubleshooting

### **PostgreSQL Not Running**
```bash
# Check status
pg_isready

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### **Database Connection Issues**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env` file
3. Check if database exists: `psql -U postgres -c "SELECT datname FROM pg_database WHERE datname='carelink';"`

### **Permission Issues**
```bash
# Create database manually
psql -U postgres -c "CREATE DATABASE carelink;"

# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE carelink TO postgres;"
```

### **Python Dependencies**
```bash
# Install missing packages
pip3 install psycopg2-binary

# Or reinstall all requirements
pip3 install -r requirements.txt
```

## 📈 Benefits of Local PostgreSQL

### **Performance**
- Faster queries (no network latency)
- Better caching
- Optimized for local development

### **Privacy**
- No data leaves your machine
- Full control over sensitive patient data
- No external API dependencies

### **Development**
- Works offline
- No monthly costs
- Easy to backup and restore
- Full database control

### **Scalability**
- Can easily migrate to cloud PostgreSQL later
- Same SQL queries work everywhere
- Standard PostgreSQL features

## 🔄 Migration Back to Supabase (If Needed)

If you need to migrate back to Supabase:

1. Keep the original Supabase files as backup
2. Update imports in `main.py`
3. Restore Supabase environment variables
4. Update database calls to use Supabase client

## 📞 Support

If you encounter issues:

1. Check PostgreSQL is running: `pg_isready`
2. Verify database credentials in `.env`
3. Run the setup script: `./setup_local_postgres.sh`
4. Check the logs for specific error messages

The local PostgreSQL setup provides the same functionality as Supabase but with better control, privacy, and no external dependencies.
