-- 1. Clients Table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255), -- NEW: Links to future Cofound AI Org
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hot_topics JSONB, -- Array of strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Style Guides (The "Brain" Settings)
CREATE TABLE style_guides (
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    persona TEXT, -- "You are a witty tech analyst..."
    negative_constraints TEXT, -- "Never use emojis. No passive voice."
    tone_examples JSONB -- Array of "Good" vs "Bad" sentences
);
-- 3. Drafts
CREATE TABLE drafts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    content TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'sent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Sources (Metadata for RAG)
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    url VARCHAR(500),
    summary TEXT,
    source_method VARCHAR(50), -- 'dashboard', 'email', 'api'
    vector_id VARCHAR(255), -- Link to Vertex AI Vector ID
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);