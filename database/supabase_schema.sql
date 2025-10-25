-- CareLink Supabase Database Schema
-- This schema stores scraped data from Bright Data to avoid expensive re-scraping

-- =============================================================================
-- SHELTERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    capacity INTEGER,
    available_beds INTEGER,
    services TEXT[], -- Array of services
    accessibility BOOLEAN DEFAULT false,
    hours TEXT,
    eligibility TEXT,
    website TEXT,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    source TEXT DEFAULT 'web_scraping',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for fast queries
    CONSTRAINT unique_shelter_name UNIQUE(name)
);

CREATE INDEX idx_shelters_available_beds ON shelters(available_beds);
CREATE INDEX idx_shelters_accessibility ON shelters(accessibility);
CREATE INDEX idx_shelters_last_updated ON shelters(last_updated);

-- =============================================================================
-- TRANSPORT TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS transport (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_type TEXT,
    availability TEXT,
    phone TEXT,
    vehicle_types TEXT[], -- Array of vehicle types
    hours TEXT,
    coverage_area TEXT,
    eligibility TEXT,
    features TEXT[], -- Array of features
    booking TEXT,
    pricing TEXT,
    website TEXT,
    source TEXT DEFAULT 'web_scraping',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_transport_service UNIQUE(provider, service_name)
);

CREATE INDEX idx_transport_service_type ON transport(service_type);
CREATE INDEX idx_transport_last_updated ON transport(last_updated);

-- =============================================================================
-- BENEFITS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name TEXT NOT NULL UNIQUE,
    eligibility_criteria TEXT[],
    income_limits TEXT[],
    benefits TEXT[],
    application_process TEXT[],
    expedited_processing TEXT[],
    benefit_amount TEXT,
    required_documents TEXT[],
    contact_info TEXT[],
    website TEXT,
    source TEXT DEFAULT 'web_scraping',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_benefits_program_name ON benefits(program_name);
CREATE INDEX idx_benefits_last_updated ON benefits(last_updated);

-- =============================================================================
-- COMMUNITY RESOURCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS community_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT, -- food_bank, medical_clinic, mental_health, etc.
    address TEXT,
    phone TEXT,
    services TEXT[],
    accessibility BOOLEAN DEFAULT false,
    hours TEXT,
    eligibility TEXT,
    website TEXT,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    source TEXT DEFAULT 'web_scraping',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_resource_name UNIQUE(name)
);

CREATE INDEX idx_resources_type ON community_resources(type);
CREATE INDEX idx_resources_accessibility ON community_resources(accessibility);
CREATE INDEX idx_resources_last_updated ON community_resources(last_updated);

-- =============================================================================
-- SCRAPING LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS scraping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- shelters, transport, benefits, resources
    url TEXT NOT NULL,
    status TEXT NOT NULL, -- success, failed, partial
    items_scraped INTEGER DEFAULT 0,
    error_message TEXT,
    duration_seconds DECIMAL(10, 2),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scraping_logs_category ON scraping_logs(category);
CREATE INDEX idx_scraping_logs_scraped_at ON scraping_logs(scraped_at);
CREATE INDEX idx_scraping_logs_status ON scraping_logs(status);

-- =============================================================================
-- CACHE METADATA TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cache_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL UNIQUE, -- shelters, transport, benefits, resources
    last_scraped TIMESTAMP WITH TIME ZONE,
    total_items INTEGER DEFAULT 0,
    cache_duration_hours INTEGER DEFAULT 24, -- How long to cache before re-scraping
    next_scrape_due TIMESTAMP WITH TIME ZONE
);

-- Insert default cache settings
INSERT INTO cache_metadata (category, cache_duration_hours) VALUES
    ('shelters', 720),    -- Re-scrape shelters every 30 days (1 month)
    ('transport', 720),   -- Re-scrape transport every 30 days (1 month)
    ('benefits', 2160),   -- Re-scrape benefits every 90 days (3 months)
    ('resources', 720)    -- Re-scrape resources every 30 days (1 month)
ON CONFLICT (category) DO NOTHING;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if cache is stale
CREATE OR REPLACE FUNCTION is_cache_stale(p_category TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_next_scrape_due TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT next_scrape_due INTO v_next_scrape_due
    FROM cache_metadata
    WHERE category = p_category;
    
    RETURN v_next_scrape_due IS NULL OR v_next_scrape_due < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update cache metadata after scraping
CREATE OR REPLACE FUNCTION update_cache_metadata(
    p_category TEXT,
    p_items_count INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE cache_metadata
    SET 
        last_scraped = NOW(),
        total_items = p_items_count,
        next_scrape_due = NOW() + (cache_duration_hours || ' hours')::INTERVAL
    WHERE category = p_category;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (Optional - for production)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations for authenticated users

CREATE POLICY "Allow all for authenticated users" ON shelters
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON transport
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON benefits
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON community_resources
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON scraping_logs
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON cache_metadata
    FOR ALL USING (true);

-- =============================================================================
-- VIEWS FOR EASY QUERYING
-- =============================================================================

-- View for available shelters
CREATE OR REPLACE VIEW available_shelters AS
SELECT 
    id,
    name,
    address,
    phone,
    available_beds,
    services,
    accessibility,
    hours,
    website,
    last_updated
FROM shelters
WHERE available_beds > 0
ORDER BY available_beds DESC;

-- View for accessible transport
CREATE OR REPLACE VIEW accessible_transport AS
SELECT 
    id,
    provider,
    service_name,
    service_type,
    phone,
    vehicle_types,
    hours,
    coverage_area,
    features,
    booking,
    pricing,
    website,
    last_updated
FROM transport
WHERE 'wheelchair_accessible_van' = ANY(vehicle_types) 
   OR 'wheelchair_accessible_suv' = ANY(vehicle_types)
   OR 'wheelchair_accessible_vehicle' = ANY(vehicle_types)
ORDER BY provider;

-- View for cache status
CREATE OR REPLACE VIEW cache_status AS
SELECT 
    category,
    last_scraped,
    total_items,
    cache_duration_hours,
    next_scrape_due,
    CASE 
        WHEN next_scrape_due IS NULL THEN 'Never scraped'
        WHEN next_scrape_due < NOW() THEN 'Stale - needs refresh'
        ELSE 'Fresh'
    END as status,
    EXTRACT(EPOCH FROM (next_scrape_due - NOW()))/3600 as hours_until_stale
FROM cache_metadata
ORDER BY category;

