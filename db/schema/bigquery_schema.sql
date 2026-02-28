-- ============================================================
-- IC Origin — BigQuery Analytical Schema
-- Version: 2.0 (Sprint 4)
-- ============================================================

-- Fact table: every signal event
-- Partitioned by ingested_at (daily) for cost-efficient scans.
-- Clustered by risk_tier + region for sub-second analytical queries.
CREATE TABLE ic_origin.fact_signals (
  signal_id         STRING,
  company_number    STRING,
  company_name      STRING,
  portfolio_id      STRING,
  risk_tier         STRING,    -- ELEVATED_RISK, STABLE, IMPROVED, UNSCORED
  conviction_score  INT64,
  signal_type       STRING,    -- NEW_CHARGE, DIRECTOR_RESIGNED, PSC_CHANGE, etc.
  source_family     STRING,    -- GOV_REGISTRY, RSS_NEWS, TALENT_FEED
  region            STRING,
  ingested_at       TIMESTAMP,
  event_date        DATE,
)
PARTITION BY DATE(ingested_at)
CLUSTER BY risk_tier, region;


-- Dimension table: portfolio membership
CREATE TABLE ic_origin.dim_portfolio_membership (
  portfolio_id      STRING,
  tenant_id         STRING,
  company_number    STRING,
  counterparty_type STRING,
  added_at          TIMESTAMP,
);


-- Analytical view: systemic risk
-- Identifies companies appearing in multiple portfolios
-- with elevated risk within the last 30 days.
CREATE VIEW ic_origin.vw_systemic_risk AS
SELECT
  company_number,
  company_name,
  COUNT(DISTINCT portfolio_id) AS portfolio_exposure_count,
  ARRAY_AGG(DISTINCT risk_tier) AS risk_tiers,
  AVG(conviction_score) AS avg_conviction,
FROM ic_origin.fact_signals s
JOIN ic_origin.dim_portfolio_membership m USING (company_number)
WHERE s.ingested_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY 1, 2
HAVING portfolio_exposure_count >= 2;
