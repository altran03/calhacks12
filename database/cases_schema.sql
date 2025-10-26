-- ============================================
-- CARELINK CASES AND FILES SCHEMA
-- ============================================

-- Cases table to store discharge cases
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL,
    patient_name TEXT NOT NULL,
    medical_record_number TEXT,
    date_of_birth TEXT,
    
    -- Contact Information
    phone_1 TEXT,
    phone_2 TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    
    -- Discharge Information
    discharging_facility TEXT,
    discharging_facility_phone TEXT,
    planned_discharge_date TIMESTAMP,
    discharged_to TEXT,
    
    -- Workflow Status
    workflow_status TEXT DEFAULT 'initiated',
    current_step TEXT,
    
    -- Assigned Resources
    assigned_shelter_id UUID REFERENCES shelters(id),
    assigned_transport_provider TEXT,
    assigned_benefits TEXT[],
    assigned_resources UUID[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Full patient data (JSON)
    patient_data JSONB,
    
    -- AI Analysis
    ai_analysis JSONB
);

-- Files table to store uploaded PDFs and documents
CREATE TABLE IF NOT EXISTS case_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_url TEXT,
    
    -- Processing status
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, error
    extracted_data JSONB,
    confidence_score DECIMAL(3, 2),
    
    -- Metadata
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Workflow timeline events
CREATE TABLE IF NOT EXISTS workflow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    step TEXT NOT NULL,
    agent TEXT NOT NULL,
    status TEXT NOT NULL, -- in_progress, completed, error
    description TEXT,
    logs TEXT[],
    
    -- Metadata
    timestamp TIMESTAMP DEFAULT NOW(),
    duration_seconds INTEGER
);

-- Agent actions log (for real agent interactions)
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- query, call, update, coordinate
    
    -- Action details
    target TEXT, -- what/who the agent interacted with
    request_data JSONB,
    response_data JSONB,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Metadata
    timestamp TIMESTAMP DEFAULT NOW(),
    duration_ms INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_workflow_status ON cases(workflow_status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_files_case_id ON case_files(case_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_case_id ON workflow_events(case_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_timestamp ON workflow_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_case_id ON agent_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_name ON agent_actions(agent_name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for case summary with related data
CREATE OR REPLACE VIEW case_summary AS
SELECT 
    c.case_id,
    c.patient_name,
    c.discharging_facility,
    c.workflow_status,
    c.current_step,
    c.created_at,
    c.updated_at,
    s.name as shelter_name,
    s.address as shelter_address,
    COUNT(DISTINCT cf.id) as file_count,
    COUNT(DISTINCT we.id) as event_count,
    MAX(we.timestamp) as last_event_time
FROM cases c
LEFT JOIN shelters s ON c.assigned_shelter_id = s.id
LEFT JOIN case_files cf ON c.case_id = cf.case_id
LEFT JOIN workflow_events we ON c.case_id = we.case_id
GROUP BY c.case_id, c.patient_name, c.discharging_facility, c.workflow_status, 
         c.current_step, c.created_at, c.updated_at, s.name, s.address;

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE case_files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

