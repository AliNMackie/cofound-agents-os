"""
IC Origin — BigQuery Contagion Engine
======================================
Populates ic_origin_themav2.directors and ic_origin_themav2.pscs
from the live Companies House API, then runs cross-pollination
SQL to detect shared persons across the portfolio.

No Neo4j. No extra cost. Pure BigQuery.
"""

import os
import time
import requests
from google.cloud import bigquery
from datetime import datetime, timezone

# ── Config ─────────────────────────────────────────────────────────────────────
CH_API_KEY  = os.environ.get("CH_API_KEY")
BQ_PROJECT  = "cofound-agents-os-788e"
BQ_DATASET  = "ic_origin_themav2"
BQ_TABLE_PORTFOLIO  = f"{BQ_PROJECT}.{BQ_DATASET}.auctions_enhanced"
BQ_TABLE_DIRECTORS  = f"{BQ_PROJECT}.{BQ_DATASET}.directors"
BQ_TABLE_PSCS       = f"{BQ_PROJECT}.{BQ_DATASET}.pscs"
CH_BASE     = "https://api.company-information.service.gov.uk"

DIRECTORS_SCHEMA = [
    bigquery.SchemaField("crn",            "STRING",    mode="REQUIRED"),
    bigquery.SchemaField("canonical_name", "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("director_name",  "STRING",    mode="REQUIRED"),
    bigquery.SchemaField("role",           "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("appointed_on",   "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("nationality",    "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("dob_year",       "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("dob_month",      "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("scraped_at",     "TIMESTAMP", mode="REQUIRED"),
]

PSCS_SCHEMA = [
    bigquery.SchemaField("crn",             "STRING",    mode="REQUIRED"),
    bigquery.SchemaField("canonical_name",  "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("psc_name",        "STRING",    mode="REQUIRED"),
    bigquery.SchemaField("kind",            "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("nature_of_control", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("nationality",     "STRING",    mode="NULLABLE"),
    bigquery.SchemaField("is_corporate",    "BOOL",      mode="NULLABLE"),
    bigquery.SchemaField("scraped_at",      "TIMESTAMP", mode="REQUIRED"),
]

def ch_get(path):
    resp = requests.get(f"{CH_BASE}{path}", auth=(CH_API_KEY, ""), timeout=10)
    return resp.json() if resp.status_code == 200 else {}

def get_officers(crn):
    data = ch_get(f"/company/{crn}/officers?items_per_page=50")
    results = []
    for item in data.get("items", []):
        if item.get("resigned_on"):
            continue
        role = item.get("officer_role", "")
        if "director" in role.lower() or "secretary" in role.lower():
            results.append({
                "crn":          crn,
                "director_name": item.get("name", "").strip().upper(),
                "role":         role,
                "appointed_on": item.get("appointed_on", ""),
                "nationality":  item.get("nationality", ""),
                "dob_year":     str(item.get("date_of_birth", {}).get("year", "")),
                "dob_month":    str(item.get("date_of_birth", {}).get("month", "")),
            })
    return results

def get_pscs(crn):
    data = ch_get(f"/company/{crn}/persons-with-significant-control")
    results = []
    for item in data.get("items", []):
        if item.get("ceased_on"):
            continue
        kind = item.get("kind", "")
        results.append({
            "crn":              crn,
            "psc_name":         item.get("name", "").strip().upper(),
            "kind":             kind,
            "nature_of_control": ", ".join(item.get("natures_of_control", [])),
            "nationality":      item.get("nationality", ""),
            "is_corporate":     "corporate" in kind or "legal" in kind,
        })
    return results

def ensure_table(client, table_id, schema):
    """Create table if it doesn't exist."""
    try:
        client.get_table(table_id)
        print(f"   Table exists: {table_id}")
    except Exception:
        table = bigquery.Table(table_id, schema=schema)
        client.create_table(table)
        print(f"   Created table: {table_id}")

def truncate_and_load(client, table_id, rows):
    """Overwrite table contents with fresh data."""
    # Delete existing rows
    client.query(f"DELETE FROM `{table_id}` WHERE TRUE").result()
    if rows:
        errors = client.insert_rows_json(table_id, rows)
        if errors:
            print(f"   ⚠️  Insert errors: {errors}")

def run_cross_pollination(client):
    """SQL-based graph traversal — no graph DB needed."""

    print("\n" + "=" * 65)
    print("  CROSS-POLLINATION ANALYSIS (BigQuery SQL)")
    print("=" * 65)

    # ── Shared Directors ──────────────────────────────────────────────
    print("\n[A] Persons directing 2+ portfolio companies:")
    q_directors = f"""
        SELECT
            director_name AS person,
            COUNT(DISTINCT crn)          AS company_count,
            ARRAY_AGG(DISTINCT canonical_name ORDER BY canonical_name) AS firms,
            ARRAY_AGG(DISTINCT crn       ORDER BY crn)       AS crns
        FROM `{BQ_TABLE_DIRECTORS}`
        GROUP BY director_name
        HAVING COUNT(DISTINCT crn) >= 2
        ORDER BY company_count DESC
    """
    director_hits = list(client.query(q_directors).result())

    if not director_hits:
        print("   ✅ No shared directors found.")
    for row in director_hits:
        print(f"\n   ⚠️  {row.person}")
        print(f"       Connected companies ({row.company_count}): {', '.join(row.firms)}")
        print(f"       CRNs: {', '.join(row.crns)}")

    # ── Shared PSCs ───────────────────────────────────────────────────
    print("\n[B] PSCs controlling 2+ portfolio companies:")
    q_pscs = f"""
        SELECT
            psc_name AS person,
            COUNT(DISTINCT crn)          AS company_count,
            ARRAY_AGG(DISTINCT canonical_name ORDER BY canonical_name) AS firms,
            ARRAY_AGG(DISTINCT crn       ORDER BY crn)       AS crns,
            MAX(CAST(is_corporate AS INT64)) AS is_corp
        FROM `{BQ_TABLE_PSCS}`
        GROUP BY psc_name
        HAVING COUNT(DISTINCT crn) >= 2
        ORDER BY company_count DESC
    """
    psc_hits = list(client.query(q_pscs).result())

    if not psc_hits:
        print("   ✅ No shared PSCs found.")
    for row in psc_hits:
        kind = "🏢 Corporate" if row.is_corp else "👤 Individual"
        print(f"\n   ⚠️  [{kind}] {row.person}")
        print(f"       Connected companies ({row.company_count}): {', '.join(row.firms)}")

    # ── Combined Summary ──────────────────────────────────────────────
    total_hits = len(director_hits) + len(psc_hits)
    print("\n" + "=" * 65)
    print(f"  Shared directors:       {len(director_hits)}")
    print(f"  Shared PSC controllers: {len(psc_hits)}")
    print(f"  Total cross-pollination vectors: {total_hits}")

    if total_hits == 0:
        print("\n  ✅ PORTFOLIO IS CLEAN — No contagion vectors detected.")
    else:
        print(f"\n  ⚠️  {total_hits} cross-pollination vector(s) found. Review required.")

    return director_hits, psc_hits

def main():
    print("=" * 65)
    print("  IC ORIGIN — BQ CONTAGION ENGINE")
    print("  No Neo4j required | Pure BigQuery")
    print("=" * 65)

    client = bigquery.Client(project=BQ_PROJECT)
    now_ts = datetime.now(timezone.utc).isoformat()

    # ── Step 1: Load portfolio ─────────────────────────────────────────
    print("\n[1/4] Loading portfolio from BigQuery...")
    portfolio = [
        (r.entity_id, r.canonical_name)
        for r in client.query(f"SELECT entity_id, canonical_name FROM `{BQ_TABLE_PORTFOLIO}`").result()
    ]
    print(f"      {len(portfolio)} companies loaded.")

    # ── Step 2: Ensure tables exist ───────────────────────────────────
    print("\n[2/4] Ensuring BQ tables exist...")
    ensure_table(client, BQ_TABLE_DIRECTORS, DIRECTORS_SCHEMA)
    ensure_table(client, BQ_TABLE_PSCS,      PSCS_SCHEMA)

    # ── Step 3: Fetch from CH API and load ───────────────────────────
    print(f"\n[3/4] Fetching live directors + PSCs from Companies House API...")
    all_directors = []
    all_pscs      = []

    for i, (crn, name) in enumerate(portfolio):
        print(f"  [{i+1:02}/{len(portfolio)}] {name} ({crn})")

        officers = get_officers(crn)
        pscs     = get_pscs(crn)

        for o in officers:
            o["canonical_name"] = name
            o["scraped_at"]     = now_ts
            all_directors.append(o)

        for p in pscs:
            p["canonical_name"] = name
            p["scraped_at"]     = now_ts
            all_pscs.append(p)

        print(f"       Directors: {len(officers)} | PSCs: {len(pscs)}")
        time.sleep(0.35)

    print(f"\n      Total rows — Directors: {len(all_directors)} | PSCs: {len(all_pscs)}")

    print("\n      Writing to BigQuery...")
    truncate_and_load(client, BQ_TABLE_DIRECTORS, all_directors)
    truncate_and_load(client, BQ_TABLE_PSCS,      all_pscs)
    print("      ✅ BigQuery tables updated.")

    # ── Step 4: Cross-pollination SQL ─────────────────────────────────
    print("\n[4/4] Running cross-pollination SQL traversal...")
    run_cross_pollination(client)

    print("\nContagion analysis complete. Results live in BigQuery.")
    print(f"  → {BQ_TABLE_DIRECTORS}")
    print(f"  → {BQ_TABLE_PSCS}")

if __name__ == "__main__":
    main()
