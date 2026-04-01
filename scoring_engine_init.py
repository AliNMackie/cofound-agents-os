"""
IC Origin — Scoring Engine Initialiser
========================================
Task 1: Creates + seeds manual_intel_signals table
Task 2: Runs Lean Graph extension → director_external_links table + v_contagion_summary view
Task 3: Creates company_profile_cache table + v_risk_scores view

Run once to provision. Idempotent — safe to re-run.
"""

import os
import time
import json
import requests
from datetime import datetime, timezone, date
from google.cloud import bigquery

# ── Config ─────────────────────────────────────────────────────────────────────
CH_API_KEY = os.environ.get("CH_API_KEY")
BQ_PROJECT = "cofound-agents-os-788e"
DS         = "ic_origin_themav2"
CH_BASE    = "https://api.company-information.service.gov.uk"

# Portfolio CRNs in our book (used to exclude self-references in lean graph)
PORTFOLIO_CRNS = set()  # populated at runtime from BQ

def ch(path, params=None):
    r = requests.get(f"{CH_BASE}{path}", auth=(CH_API_KEY, ""),
                     params=params or {}, timeout=10)
    return r.json() if r.status_code == 200 else {}

def bq_table(name):
    return f"{BQ_PROJECT}.{DS}.{name}"

def ensure_table(client, table_id, schema, description=""):
    try:
        client.get_table(table_id)
        print(f"   ✓ Exists: {table_id}")
    except Exception:
        t = bigquery.Table(table_id, schema=schema)
        t.description = description
        client.create_table(t)
        print(f"   ✓ Created: {table_id}")

def truncate(client, table_id):
    client.query(f"DELETE FROM `{table_id}` WHERE TRUE").result()

def run_view_ddl(client, ddl):
    client.query(ddl).result()


# ════════════════════════════════════════════════════════════════════
# TASK 1 — manual_intel_signals
# ════════════════════════════════════════════════════════════════════

MANUAL_SIGNALS_SCHEMA = [
    bigquery.SchemaField("company_number",   "STRING",    mode="REQUIRED"),
    bigquery.SchemaField("canonical_name",   "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("sentiment_score",  "INTEGER",   mode="REQUIRED"),  # 0 or 2
    bigquery.SchemaField("macro_multiplier", "INTEGER",   mode="REQUIRED"),  # 0 or 1
    bigquery.SchemaField("soft_notes",       "STRING",    mode="NULLABLE"),  # human annotation
    bigquery.SchemaField("last_updated",     "TIMESTAMP", mode="REQUIRED"),
]

def task1_manual_intel_signals(client, portfolio):
    print("\n── TASK 1: manual_intel_signals ──────────────────────────")
    tid = bq_table("manual_intel_signals")
    ensure_table(client, tid, MANUAL_SIGNALS_SCHEMA,
                 "Shadow soft-signal overrides from Grok/Perplexity research")

    truncate(client, tid)
    now = datetime.now(timezone.utc).isoformat()

    # Pre-seeded with findings from our April 1 triangulation session
    OVERRIDES = {
        "02259954": {  # SEASALT LIMITED
            "sentiment_score":  2,
            "macro_multiplier": 1,
            "soft_notes": "Argentex LLP special admin Jul-25: Seasalt creditor "
                          "with live FX forward contracts. New Barclays fixed charge "
                          "#19 filed 1 month post-collapse (Aug-25). Share capital "
                          "restructure Sep-25. Director change Nov-25. "
                          "SOME CONCERN — ELEVATED. Hormuz: supply chain FX sensitivity.",
        },
        "08316049": {  # OONI LIMITED
            "sentiment_score":  0,
            "macro_multiplier": 0,
            "soft_notes": "Clean. HSBC Innovation debt retired Oct-Nov 2024. "
                          "New HSBC UK mainstream debenture Oct-25 = bank graduation, "
                          "not distress. Grok concern RESOLVED by hard data.",
        },
    }

    rows = []
    for crn, name in portfolio:
        override = OVERRIDES.get(crn, {})
        rows.append({
            "company_number":   crn,
            "canonical_name":   name,
            "sentiment_score":  override.get("sentiment_score", 0),
            "macro_multiplier": override.get("macro_multiplier", 0),
            "soft_notes":       override.get("soft_notes", "No soft signal — clean."),
            "last_updated":     now,
        })

    errors = client.insert_rows_json(tid, rows)
    if errors:
        print(f"   ⚠️  Insert errors: {errors}")
    else:
        print(f"   ✓ Seeded {len(rows)} rows into manual_intel_signals")


# ════════════════════════════════════════════════════════════════════
# TASK 1B — company_profile_cache (Hard Signal source)
# ════════════════════════════════════════════════════════════════════

PROFILE_CACHE_SCHEMA = [
    bigquery.SchemaField("entity_id",           "STRING",  mode="REQUIRED"),
    bigquery.SchemaField("canonical_name",       "STRING",  mode="NULLABLE"),
    bigquery.SchemaField("company_status",       "STRING",  mode="NULLABLE"),
    bigquery.SchemaField("outstanding_charges",  "INTEGER", mode="NULLABLE"),
    bigquery.SchemaField("total_charges",        "INTEGER", mode="NULLABLE"),
    bigquery.SchemaField("recent_charge_90d",    "BOOL",    mode="NULLABLE"),
    bigquery.SchemaField("most_recent_charge",   "STRING",  mode="NULLABLE"),  # DATE as STRING
    bigquery.SchemaField("accounts_overdue",     "BOOL",    mode="NULLABLE"),
    bigquery.SchemaField("insolvency_active",    "BOOL",    mode="NULLABLE"),
    bigquery.SchemaField("last_fetched",         "TIMESTAMP", mode="REQUIRED"),
]

def task1b_profile_cache(client, portfolio):
    print("\n── TASK 1B: company_profile_cache ────────────────────────")
    tid = bq_table("company_profile_cache")
    ensure_table(client, tid, PROFILE_CACHE_SCHEMA,
                 "Cached hard signals per company: charges, insolvency, overdue accounts")
    truncate(client, tid)

    now_ts  = datetime.now(timezone.utc).isoformat()
    cutoff  = date(2025, 12, 31)  # Anything after = within 90 days of April 1 2026
    rows    = []

    for i, (crn, name) in enumerate(portfolio):
        print(f"  [{i+1:02}/{len(portfolio)}] {name} ({crn})")

        # Profile (overdue accounts)
        profile = ch(f"/company/{crn}")
        accounts        = profile.get("accounts", {})
        accounts_overdue = accounts.get("overdue", False)
        company_status  = profile.get("company_status", "unknown")

        # Charges
        charges_data     = ch(f"/company/{crn}/charges")
        all_charges      = charges_data.get("items", [])
        outstanding      = [c for c in all_charges if c.get("status") == "outstanding"]
        charge_dates     = [c.get("created_on", "") for c in outstanding if c.get("created_on")]
        sorted_dates     = sorted(charge_dates, reverse=True)
        most_recent      = sorted_dates[0] if sorted_dates else None
        recent_90d       = False
        if most_recent:
            try:
                recent_90d = date.fromisoformat(most_recent) > cutoff
            except ValueError:
                pass

        # Insolvency
        ins_resp         = requests.get(
            f"{CH_BASE}/company/{crn}/insolvency",
            auth=(CH_API_KEY, ""), timeout=10
        )
        insolvency_active = (
            ins_resp.status_code == 200
            and len(ins_resp.json().get("cases", [])) > 0
        )

        rows.append({
            "entity_id":          crn,
            "canonical_name":     name,
            "company_status":     company_status,
            "outstanding_charges": len(outstanding),
            "total_charges":      charges_data.get("total_count", 0),
            "recent_charge_90d":  recent_90d,
            "most_recent_charge": most_recent,
            "accounts_overdue":   accounts_overdue,
            "insolvency_active":  insolvency_active,
            "last_fetched":       now_ts,
        })
        time.sleep(0.35)

    errors = client.insert_rows_json(tid, rows)
    if errors:
        print(f"   ⚠️  Errors: {errors}")
    else:
        print(f"   ✓ Populated company_profile_cache with {len(rows)} rows")


# ════════════════════════════════════════════════════════════════════
# TASK 2 — Lean Graph: director_external_links + v_contagion_summary
# ════════════════════════════════════════════════════════════════════

EXT_LINKS_SCHEMA = [
    bigquery.SchemaField("portfolio_crn",       "STRING", mode="REQUIRED"),
    bigquery.SchemaField("portfolio_name",      "STRING", mode="NULLABLE"),
    bigquery.SchemaField("director_name",       "STRING", mode="REQUIRED"),
    bigquery.SchemaField("officer_id",          "STRING", mode="NULLABLE"),
    bigquery.SchemaField("external_crn",        "STRING", mode="REQUIRED"),
    bigquery.SchemaField("external_company",    "STRING", mode="NULLABLE"),
    bigquery.SchemaField("external_status",     "STRING", mode="NULLABLE"),
    bigquery.SchemaField("appointment_type",    "STRING", mode="NULLABLE"),
    bigquery.SchemaField("is_distressed",       "BOOL",   mode="NULLABLE"),
    bigquery.SchemaField("scraped_at",          "TIMESTAMP", mode="REQUIRED"),
]

DISTRESSED_STATUSES = {
    "liquidation", "administration", "receivership",
    "active-proposal-to-strike-off", "dissolved",
    "voluntary-arrangement", "insolvency-proceedings",
}

def get_officer_id(director_name, dob_year, dob_month):
    """Search CH for officer, match by DOB, return officer_id."""
    results = ch("/search/officers", {"q": director_name, "items_per_page": 20})
    for item in results.get("items", []):
        dob = item.get("date_of_birth", {})
        if str(dob.get("year", "")) == str(dob_year) and \
           str(dob.get("month", "")) == str(dob_month):
            links = item.get("links", {})
            officer_path = links.get("self", "")
            if "/officers/" in officer_path:
                return officer_path.split("/officers/")[1].split("/")[0]
    return None

def task2_lean_graph(client, portfolio):
    print("\n── TASK 2: Lean Graph Extension ──────────────────────────")
    tid = bq_table("director_external_links")
    ensure_table(client, tid, EXT_LINKS_SCHEMA,
                 "Cross-portfolio director → external distressed company links (Lean Graph)")
    truncate(client, tid)

    # Load director table with DOB for matching
    directors_rows = list(client.query(
        f"SELECT crn, canonical_name, director_name, dob_year, dob_month "
        f"FROM `{bq_table('directors')}`"
    ).result())

    now_ts = datetime.now(timezone.utc).isoformat()
    ext_rows = []
    seen_officers = {}  # officer_id → appointments (cache to avoid duplicate API calls)

    print(f"   Scanning {len(directors_rows)} directors for external distressed links...")

    for i, row in enumerate(directors_rows):
        crn   = row.crn
        name  = row.canonical_name
        dname = row.director_name

        # Get officer ID (with cache)
        cache_key = f"{dname}|{row.dob_year}|{row.dob_month}"
        if cache_key not in seen_officers:
            oid = get_officer_id(dname, row.dob_year, row.dob_month)
            seen_officers[cache_key] = oid
            time.sleep(0.3)
        else:
            oid = seen_officers[cache_key]

        if not oid:
            continue

        # Get all appointments for this officer
        apt_cache_key = oid
        if apt_cache_key not in seen_officers:
            appointments = ch(f"/officers/{oid}/appointments", {"items_per_page": 50})
            seen_officers[apt_cache_key] = appointments.get("items", [])
            time.sleep(0.3)
        appointments_list = seen_officers.get(apt_cache_key, [])

        for apt in appointments_list:
            # Skip appointments to our own portfolio companies
            ext_crn = apt.get("appointed_to", {}).get("company_number", "")
            if not ext_crn or ext_crn in PORTFOLIO_CRNS:
                continue

            ext_name   = apt.get("appointed_to", {}).get("company_name", "")
            ext_status = apt.get("appointed_to", {}).get("company_status", "")
            apt_role   = apt.get("officer_role", "")
            is_dist    = ext_status.lower() in DISTRESSED_STATUSES if ext_status else False

            if is_dist:  # Only store distressed external links to keep table lean
                ext_rows.append({
                    "portfolio_crn":    crn,
                    "portfolio_name":   name,
                    "director_name":    dname,
                    "officer_id":       oid,
                    "external_crn":     ext_crn,
                    "external_company": ext_name,
                    "external_status":  ext_status,
                    "appointment_type": apt_role,
                    "is_distressed":    True,
                    "scraped_at":       now_ts,
                })

    if ext_rows:
        errors = client.insert_rows_json(tid, ext_rows)
        if errors:
            print(f"   ⚠️  Errors: {errors}")
        else:
            print(f"   ✓ Found {len(ext_rows)} distressed external director links")
    else:
        print("   ✓ No distressed external links found — portfolio director network is clean")

    # Create v_contagion_summary view
    view_ddl = f"""
    CREATE OR REPLACE VIEW `{bq_table('v_contagion_summary')}` AS
    SELECT
        portfolio_crn                            AS entity_id,
        portfolio_name                           AS canonical_name,
        COUNT(DISTINCT external_crn)             AS distressed_link_count,
        ARRAY_AGG(DISTINCT director_name)        AS flagged_directors,
        ARRAY_AGG(DISTINCT external_company)     AS linked_distressed_companies,
        ARRAY_AGG(DISTINCT external_status)      AS external_statuses,
        MAX(scraped_at)                          AS last_checked
    FROM `{bq_table('director_external_links')}`
    WHERE is_distressed = TRUE
    GROUP BY portfolio_crn, portfolio_name
    """
    run_view_ddl(client, view_ddl)
    print(f"   ✓ View created: v_contagion_summary")


# ════════════════════════════════════════════════════════════════════
# TASK 3 — v_risk_scores view
# ════════════════════════════════════════════════════════════════════

def task3_risk_scores_view(client):
    print("\n── TASK 3: v_risk_scores view ────────────────────────────")

    view_ddl = f"""
    CREATE OR REPLACE VIEW `{bq_table('v_risk_scores')}` AS

    WITH base AS (
        SELECT
            entity_id,
            canonical_name,
            JSON_VALUE(resolution_metadata, '$.company_status')         AS company_status,
            CAST(JSON_VALUE(resolution_metadata, '$.active_distress_signal') AS BOOL)
                                                                         AS active_distress,
            last_updated
        FROM `{bq_table('auctions_enhanced')}`
    ),

    profile AS (
        SELECT
            entity_id,
            outstanding_charges,
            COALESCE(recent_charge_90d,  FALSE) AS recent_charge_90d,
            COALESCE(accounts_overdue,   FALSE) AS accounts_overdue,
            COALESCE(insolvency_active,  FALSE) AS insolvency_active
        FROM `{bq_table('company_profile_cache')}`
    ),

    soft AS (
        SELECT
            company_number,
            COALESCE(sentiment_score,  0) AS sentiment_score,
            COALESCE(macro_multiplier, 0) AS macro_multiplier,
            soft_notes
        FROM `{bq_table('manual_intel_signals')}`
    ),

    graph AS (
        SELECT
            entity_id,
            COALESCE(distressed_link_count, 0) AS distressed_link_count,
            linked_distressed_companies,
            flagged_directors
        FROM `{bq_table('v_contagion_summary')}`
    ),

    scored AS (
        SELECT
            b.entity_id,
            b.canonical_name,
            b.company_status,
            b.last_updated,

            -- ── HARD SIGNALS (max 6) ───────────────────────────────
            -- Charges (max 3): 3 if recent <90d, 2 if 2+ outstanding, 1 if any outstanding
            CASE
                WHEN COALESCE(p.recent_charge_90d,  FALSE)                THEN 3
                WHEN COALESCE(p.outstanding_charges, 0) >= 2              THEN 2
                WHEN COALESCE(p.outstanding_charges, 0) >= 1              THEN 1
                ELSE 0
            END AS charge_score,

            -- Insolvency (max 2)
            CASE
                WHEN COALESCE(p.insolvency_active, FALSE) OR COALESCE(b.active_distress, FALSE)
                THEN 2
                ELSE 0
            END AS insolvency_score,

            -- Overdue accounts (max 1)
            IF(COALESCE(p.accounts_overdue, FALSE), 1, 0) AS overdue_score,

            -- ── SOFT SIGNALS (max 2) ───────────────────────────────
            COALESCE(s.sentiment_score, 0)  AS soft_score,
            COALESCE(s.macro_multiplier, 0) AS macro_score,
            COALESCE(s.soft_notes, '')      AS soft_notes,

            -- ── GRAPH SIGNAL (max 1) ───────────────────────────────
            IF(COALESCE(g.distressed_link_count, 0) > 0, 1, 0) AS graph_score,

            -- ── CONTEXT ────────────────────────────────────────────
            COALESCE(p.outstanding_charges, 0)  AS outstanding_charges,
            COALESCE(p.recent_charge_90d, FALSE) AS has_recent_charge,
            COALESCE(p.insolvency_active, FALSE)  AS has_insolvency,
            g.linked_distressed_companies,
            g.flagged_directors

        FROM base b
        LEFT JOIN profile p ON b.entity_id = p.entity_id
        LEFT JOIN soft    s ON b.entity_id = s.company_number
        LEFT JOIN graph   g ON b.entity_id = g.entity_id
    )

    SELECT
        entity_id,
        canonical_name,
        company_status,
        last_updated,
        charge_score,
        insolvency_score,
        overdue_score,
        soft_score,
        macro_score,
        graph_score,
        soft_notes,
        outstanding_charges,
        has_recent_charge,
        has_insolvency,
        linked_distressed_companies,
        flagged_directors,

        -- ── TOTAL SCORE (capped at 10) ─────────────────────────────
        LEAST(10, charge_score + insolvency_score + overdue_score
                + soft_score + macro_score + graph_score) AS risk_score,

        -- ── RISK LABEL ─────────────────────────────────────────────
        CASE
            WHEN LEAST(10, charge_score + insolvency_score + overdue_score
                        + soft_score + macro_score + graph_score) >= 7
                THEN 'HIGH_RISK'
            WHEN LEAST(10, charge_score + insolvency_score + overdue_score
                        + soft_score + macro_score + graph_score) >= 4
                THEN 'SOME_CONCERN'
            ELSE 'CLEAN'
        END AS risk_label

    FROM scored
    ORDER BY risk_score DESC, canonical_name
    """

    run_view_ddl(client, view_ddl)
    print(f"   ✓ View created: v_risk_scores")


# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════

def main():
    print("=" * 65)
    print("  IC Origin — Scoring Engine Initialiser")
    print("  Tasks 1 · 1B · 2 · 3")
    print("=" * 65)

    client = bigquery.Client(project=BQ_PROJECT)

    # Load portfolio
    portfolio = [
        (r.entity_id, r.canonical_name)
        for r in client.query(
            f"SELECT entity_id, canonical_name "
            f"FROM `{bq_table('auctions_enhanced')}`"
        ).result()
    ]
    PORTFOLIO_CRNS.update(crn for crn, _ in portfolio)
    print(f"\n   Portfolio: {len(portfolio)} companies loaded")

    task1_manual_intel_signals(client, portfolio)
    task1b_profile_cache(client, portfolio)
    task2_lean_graph(client, portfolio)
    task3_risk_scores_view(client)

    # Live score check
    print("\n── LIVE SCORE PREVIEW ────────────────────────────────────")
    scores = list(client.query(
        f"SELECT canonical_name, risk_score, risk_label, charge_score, "
        f"soft_score, macro_score, graph_score "
        f"FROM `{bq_table('v_risk_scores')}` ORDER BY risk_score DESC LIMIT 10"
    ).result())

    print(f"\n{'Company':<35} {'Score':>5}  {'Label':<14} {'Charge':>6} {'Soft':>4} {'Macro':>5} {'Graph':>5}")
    print("-" * 80)
    for r in scores:
        print(f"{r.canonical_name:<35} {r.risk_score:>5}  {r.risk_label:<14} "
              f"{r.charge_score:>6} {r.soft_score:>4} {r.macro_score:>5} {r.graph_score:>5}")

    high_risk = [r for r in scores if r.risk_label == "HIGH_RISK"]
    print(f"\n{'='*65}")
    print(f"  HIGH RISK triggers (≥7): {len(high_risk)}")
    if high_risk:
        for r in high_risk:
            print(f"  🚨 {r.canonical_name} — {r.risk_score}/10")

    print("\nScoring engine initialised. Run dispatch_alerts() to send Telegram alerts.")

if __name__ == "__main__":
    main()
