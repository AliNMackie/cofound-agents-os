"""
IC Origin — Portfolio Contagion Analysis
========================================
Ingests all 40 portfolio companies into Neo4j AuraDB.
Maps Director and PSC relationships via live Companies House API.
Detects cross-pollination (shared persons across multiple portfolio companies).
Flags 'Distressed Director' connections as CRITICAL SYSTEMIC RISK.
"""

import os
import time
import json
import requests
from collections import defaultdict
from neo4j import GraphDatabase
from google.cloud import bigquery

# ── Credentials ────────────────────────────────────────────────────────────────
CH_API_KEY   = os.environ.get("CH_API_KEY")
NEO4J_URI    = os.environ.get("NEO4J_URI",  "neo4j+s://64f48d1c.databases.neo4j.io")
NEO4J_USER   = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASS   = os.environ.get("NEO4J_PASS", "Vnky-Qem68LGYbLnM8jFAmLuUP2VGPzgQA36rWCJPD4")
BQ_PROJECT   = "cofound-agents-os-788e"
BQ_TABLE     = "ic_origin_themav2.auctions_enhanced"

CH_BASE      = "https://api.company-information.service.gov.uk"

# Known insolvency practitioners / distressed directors blacklist
# (Seed list — expand as the graph grows)
BLACKLIST_KEYWORDS = [
    "administrator", "liquidator", "insolvency practitioner",
    "kroll", "frp advisory", "alvarez & marsal", "interpath",
    "begbies traynor", "grant thornton restructuring", "deloitte restructuring",
    "pwc restructuring", "ey restructuring", "teneo restructuring",
]

def ch_get(path):
    """Hit the Companies House API."""
    resp = requests.get(f"{CH_BASE}{path}", auth=(CH_API_KEY, ""), timeout=10)
    if resp.status_code == 200:
        return resp.json()
    return {}

def get_officers(crn):
    """Fetch current active directors."""
    data = ch_get(f"/company/{crn}/officers?items_per_page=50")
    officers = []
    for item in data.get("items", []):
        if item.get("resigned_on"):
            continue  # only active
        role = item.get("officer_role", "")
        if "director" in role.lower() or "secretary" in role.lower():
            officers.append({
                "name": item.get("name", "").strip().upper(),
                "role": role,
                "appointed_on": item.get("appointed_on", ""),
                "nationality": item.get("nationality", ""),
                "dob_year": item.get("date_of_birth", {}).get("year", ""),
                "dob_month": item.get("date_of_birth", {}).get("month", ""),
            })
    return officers

def get_pscs(crn):
    """Fetch Persons with Significant Control."""
    data = ch_get(f"/company/{crn}/persons-with-significant-control")
    pscs = []
    for item in data.get("items", []):
        if item.get("ceased_on"):
            continue  # only active
        kind = item.get("kind", "")
        if "individual" in kind:
            pscs.append({
                "name": item.get("name", "").strip().upper(),
                "kind": kind,
                "nature_of_control": item.get("natures_of_control", []),
                "nationality": item.get("nationality", ""),
                "is_corporate": False,
            })
        elif "corporate" in kind or "legal" in kind:
            pscs.append({
                "name": item.get("name", "").strip().upper(),
                "kind": kind,
                "nature_of_control": item.get("natures_of_control", []),
                "is_corporate": True,
            })
    return pscs

def ingest_company(session, crn, canonical_name, officers, pscs):
    """Write company + relationships into Neo4j."""

    # Create/merge Company node
    session.run(
        "MERGE (c:Company {crn: $crn}) "
        "SET c.name = $name, c.updated = timestamp()",
        crn=crn, name=canonical_name
    )

    # Directors
    for o in officers:
        session.run(
            "MERGE (p:Person {name: $name}) "
            "ON CREATE SET p.nationality = $nat, p.dob_year = $yr, p.dob_month = $mo "
            "WITH p "
            "MATCH (c:Company {crn: $crn}) "
            "MERGE (c)-[r:HAS_DIRECTOR {role: $role}]->(p) "
            "SET r.appointed_on = $appointed",
            name=o["name"], nat=o.get("nationality",""), yr=str(o.get("dob_year","")),
            mo=str(o.get("dob_month","")), crn=crn, role=o["role"],
            appointed=o.get("appointed_on","")
        )

    # PSCs
    for p in pscs:
        if p["is_corporate"]:
            session.run(
                "MERGE (e:Entity {name: $name}) "
                "WITH e "
                "MATCH (c:Company {crn: $crn}) "
                "MERGE (c)-[:HAS_PSC]->(e)",
                name=p["name"], crn=crn
            )
        else:
            session.run(
                "MERGE (p:Person {name: $name}) "
                "ON CREATE SET p.nationality = $nat "
                "WITH p "
                "MATCH (c:Company {crn: $crn}) "
                "MERGE (c)-[:HAS_PSC]->(p)",
                name=p["name"], nat=p.get("nationality",""), crn=crn
            )

def detect_cross_pollination(session):
    """Find persons connected to 2+ portfolio companies."""
    result = session.run(
        """
        MATCH (p:Person)--(c:Company)
        WITH p, collect(c.name) AS companies, collect(c.crn) AS crns, count(c) AS cnt
        WHERE cnt >= 2
        RETURN p.name AS person, companies, crns, cnt
        ORDER BY cnt DESC
        """
    )
    return [dict(r) for r in result]

def detect_corporate_cross_pollination(session):
    """Find corporate entities controlling 2+ portfolio companies."""
    result = session.run(
        """
        MATCH (e:Entity)--(c:Company)
        WITH e, collect(c.name) AS companies, collect(c.crn) AS crns, count(c) AS cnt
        WHERE cnt >= 2
        RETURN e.name AS entity, companies, crns, cnt
        ORDER BY cnt DESC
        """
    )
    return [dict(r) for r in result]

def check_blacklist(name):
    """Flag if a name matches known IP/distressed patterns."""
    name_lower = name.lower()
    return any(kw in name_lower for kw in BLACKLIST_KEYWORDS)

def main():
    print("=" * 65)
    print("  IC ORIGIN — PORTFOLIO CONTAGION ANALYSIS")
    print("  Neo4j AuraDB | europe-west2 | 40 Companies")
    print("=" * 65)

    # ── Step 1: Load portfolio from BigQuery ───────────────────────────
    print("\n[1/4] Loading portfolio from BigQuery...")
    bq = bigquery.Client(project=BQ_PROJECT)
    rows = bq.query(
        f"SELECT entity_id, canonical_name FROM `{BQ_PROJECT}.{BQ_TABLE}`"
    ).result()
    portfolio = [(r.entity_id, r.canonical_name) for r in rows]
    print(f"      Loaded {len(portfolio)} companies.")

    # ── Step 2: Connect to Neo4j and ingest ───────────────────────────
    print(f"\n[2/4] Connecting to Neo4j: {NEO4J_URI}")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    driver.verify_connectivity()
    print("      ✅ Neo4j connection verified.")

    with driver.session() as session:
        # Create uniqueness constraints
        session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (c:Company) REQUIRE c.crn IS UNIQUE")
        session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE")
        session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE")

        print(f"\n      Ingesting {len(portfolio)} companies into graph...\n")

        for i, (crn, name) in enumerate(portfolio):
            print(f"  [{i+1:02}/{len(portfolio)}] {name} ({crn})")

            officers = get_officers(crn)
            pscs     = get_pscs(crn)

            print(f"         Directors: {len(officers)} | PSCs: {len(pscs)}")
            ingest_company(session, crn, name, officers, pscs)

            time.sleep(0.4)  # CH rate limit headroom

        # ── Step 3: Cross-Pollination Detection ───────────────────────
        print("\n[3/4] Running cross-pollination graph traversal...")

        persons_shared  = detect_cross_pollination(session)
        entities_shared = detect_corporate_cross_pollination(session)

        # ── Step 4: Report ────────────────────────────────────────────
        print("\n[4/4] Generating High-Risk Cluster Report...\n")
        print("=" * 65)
        print("  HIGH-RISK CLUSTER REPORT")
        print("=" * 65)

        critical_clusters = []
        concern_clusters  = []

        for rec in persons_shared:
            person   = rec["person"]
            companies = rec["companies"]
            crns     = rec["crns"]
            cnt      = rec["cnt"]
            is_bl    = check_blacklist(person)

            if is_bl:
                critical_clusters.append(rec)
                print(f"\n  🚨 CRITICAL SYSTEMIC RISK — BLACKLISTED PERSON")
                print(f"     Person:    {person}")
                print(f"     Connected: {cnt} portfolio companies")
                print(f"     Firms:     {', '.join(companies)}")
                print(f"     CRNs:      {', '.join(crns)}")
            else:
                concern_clusters.append(rec)
                print(f"\n  ⚠️  CROSS-POLLINATION DETECTED")
                print(f"     Person:    {person}")
                print(f"     Connected: {cnt} portfolio companies")
                print(f"     Firms:     {', '.join(companies)}")

        for rec in entities_shared:
            entity   = rec["entity"]
            companies = rec["companies"]
            cnt      = rec["cnt"]
            print(f"\n  🏢 SHARED CORPORATE CONTROLLER")
            print(f"     Entity:    {entity}")
            print(f"     Connected: {cnt} portfolio companies")
            print(f"     Firms:     {', '.join(companies)}")

        # Summary
        print("\n" + "=" * 65)
        print("  SUMMARY")
        print("=" * 65)
        print(f"  Portfolio size:            {len(portfolio)} companies")
        print(f"  Cross-pollinated persons:  {len(persons_shared)}")
        print(f"  Shared corporate entities: {len(entities_shared)}")
        print(f"  CRITICAL clusters:         {len(critical_clusters)} (blacklisted IPs)")
        print(f"  CONCERN clusters:          {len(concern_clusters)} (shared directors)")

        if critical_clusters:
            print("\n  🚨 TELEGRAM ALERT TRIGGERED — CRITICAL SYSTEMIC RISK DETECTED")
            print("     (Configure TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to enable)")
        elif concern_clusters:
            print("\n  ⚠️  Shared director connections found — review recommended")
        else:
            print("\n  ✅ No cross-pollination detected. Portfolio is clean.")

        # Save results to JSON
        results = {
            "run_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "portfolio_size": len(portfolio),
            "cross_pollinated_persons": [
                {k: list(v) if isinstance(v, list) else v for k, v in r.items()}
                for r in persons_shared
            ],
            "shared_entities": [
                {k: list(v) if isinstance(v, list) else v for k, v in r.items()}
                for r in entities_shared
            ],
            "critical_clusters": len(critical_clusters),
        }
        with open("contagion_report.json", "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n  Full report saved → contagion_report.json")

    driver.close()
    print("\nContagion analysis complete.")

if __name__ == "__main__":
    main()
