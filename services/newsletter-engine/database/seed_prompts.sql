-- Seed Data: Base Archetypes
-- Note: organization_id is set to NULL or a placeholder for now
INSERT INTO clients (organization_id, name, email, hot_topics) VALUES 
('org_demo_001', 'Demo Client', 'demo@example.com', '["AI Agents", "SaaS Pricing"]');
INSERT INTO style_guides (client_id, persona, negative_constraints) VALUES
(1, 
 'You are a senior strategist. You write in short, punchy sentences. You value data over opinion.', 
 'Do not use corporate jargon like "synergy" or "deep dive". Avoid exclamation marks.');