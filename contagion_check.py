"""
IC Origin — Contagion Re-Traversal (Fixed Cypher)
Deduplicates company connections before counting cross-pollination.
"""

import os
import json
import time
from neo4j import GraphDatabase

NEO4J_URI  = os.environ.get("NEO4J_URI",  "neo4j+s://64f48d1c.databases.neo4j.io")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASS = os.environ.get("NEO4J_PASS", "Vnky-Qem68LGYbLnM8jFAmLuUP2VGPzgQA36rWCJPD4")

BLACKLIST_KEYWORDS = [
    "administrator", "liquidator", "insolvency practitioner",
    "kroll", "frp advisory", "alvarez & marsal", "interpath",
    "begbies traynor", "grant thornton restructuring", "deloitte restructuring",
    "pwc restructuring", "ey restructuring", "teneo restructuring",
]

def check_blacklist(name):
    name_lower = name.lower()
    return any(kw in name_lower for kw in BLACKLIST_KEYWORDS)

def main():
    print("=" * 65)
    print("  IC ORIGIN — CROSS-POLLINATION TRAVERSAL (FIXED)")
    print("=" * 65)

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    driver.verify_connectivity()
    print("✅ Connected to Neo4j AuraDB\n")

    with driver.session() as session:

        # ── True cross-portfolio person detection ─────────────────────
        # Deduplicate: count DISTINCT companies per person
        print("[1/3] Detecting persons connected to 2+ DISTINCT portfolio companies...")
        persons = session.run(
            """
            MATCH (p:Person)--(c:Company)
            WITH p, collect(DISTINCT c.name) AS companies,
                    collect(DISTINCT c.crn)  AS crns,
                    count(DISTINCT c)        AS cnt
            WHERE cnt >= 2
            RETURN p.name AS person, companies, crns, cnt
            ORDER BY cnt DESC
            """
        )
        person_hits = [dict(r) for r in persons]

        # ── Corporate entity cross-pollination ────────────────────────
        print("[2/3] Detecting corporate entities controlling 2+ DISTINCT companies...")
        entities = session.run(
            """
            MATCH (e:Entity)--(c:Company)
            WITH e, collect(DISTINCT c.name) AS companies,
                    collect(DISTINCT c.crn)  AS crns,
                    count(DISTINCT c)        AS cnt
            WHERE cnt >= 2
            RETURN e.name AS entity, companies, crns, cnt
            ORDER BY cnt DESC
            """
        )
        entity_hits = [dict(r) for r in entities]

        # ── Total graph stats ─────────────────────────────────────────
        stats = session.run(
            """
            MATCH (c:Company) WITH count(c) AS companies
            MATCH (p:Person)  WITH companies, count(p) AS persons
            MATCH (e:Entity)  WITH companies, persons, count(e) AS entities
            RETURN companies, persons, entities
            """
        ).single()

        # ── Report ────────────────────────────────────────────────────
        print("\n[3/3] Generating report...\n")
        print("=" * 65)
        print("  GRAPH DATABASE STATS")
        print("=" * 65)
        if stats:
            print(f"  Company nodes:  {stats['companies']}")
            print(f"  Person nodes:   {stats['persons']}")
            print(f"  Entity nodes:   {stats['entities']}")

        print("\n" + "=" * 65)
        print("  HIGH-RISK CLUSTER REPORT")
        print("=" * 65)

        critical = []
        concern  = []

        if not person_hits and not entity_hits:
            print("\n  ✅ NO CROSS-POLLINATION DETECTED")
            print("     Every person and entity in the graph is unique to")
            print("     a single portfolio company. No shared connections found.")
        else:
            for rec in person_hits:
                person    = rec["person"]
                companies = list(rec["companies"])
                crns      = list(rec["crns"])
                cnt       = rec["cnt"]
                is_bl     = check_blacklist(person)

                if is_bl:
                    critical.append(rec)
                    print(f"\n  🚨 CRITICAL — BLACKLISTED PERSON BRIDGES {cnt} PORTFOLIO COMPANIES")
                    print(f"     Name:      {person}")
                    print(f"     Firms:     {', '.join(companies)}")
                    print(f"     CRNs:      {', '.join(crns)}")
                    print(f"     ACTION:    IMMEDIATE review + Telegram alert")
                else:
                    concern.append(rec)
                    print(f"\n  ⚠️  CROSS-POLLINATION — {cnt} COMPANIES SHARE A PERSON")
                    print(f"     Name:    {person}")
                    print(f"     Firms:   {', '.join(companies)}")
                    print(f"     CRNs:    {', '.join(crns)}")

            for rec in entity_hits:
                entity    = rec["entity"]
                companies = list(rec["companies"])
                cnt       = rec["cnt"]
                print(f"\n  🏢 SHARED CORPORATE CONTROLLER — {cnt} COMPANIES")
                print(f"     Entity:  {entity}")
                print(f"     Firms:   {', '.join(companies)}")

        print("\n" + "=" * 65)
        print("  FINAL SUMMARY")
        print("=" * 65)
        print(f"  True cross-portfolio persons:   {len(person_hits)}")
        print(f"  Shared corporate controllers:   {len(entity_hits)}")
        print(f"  CRITICAL (blacklisted):         {len(critical)}")
        print(f"  CONCERN (shared, not blacklisted): {len(concern)}")

        if critical:
            print("\n  🚨 TELEGRAM ALERT: CRITICAL SYSTEMIC RISK")
        elif concern:
            print("\n  ⚠️  Log for review — no immediate systemic risk")
        else:
            print("\n  ✅ PORTFOLIO IS CLEAN — No contagion vectors found")

        # Save
        report = {
            "run_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "cross_pollinated_persons": [
                {k: list(v) if hasattr(v, '__iter__') and not isinstance(v, str) else v
                 for k, v in r.items()} for r in person_hits
            ],
            "shared_entities": [
                {k: list(v) if hasattr(v, '__iter__') and not isinstance(v, str) else v
                 for k, v in r.items()} for r in entity_hits
            ],
            "graph_stats": dict(stats) if stats else {},
            "verdict": "CRITICAL" if critical else ("CONCERN" if concern else "CLEAN"),
        }
        with open("contagion_report.json", "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n  Saved → contagion_report.json")

    driver.close()

if __name__ == "__main__":
    main()
