"""
IC Origin — Neo4j Graph Service

Manages entity relationship graphs for contagion risk analysis.
Provides upsert operations for Company/Person nodes and Director/PSC edges,
plus 2-hop contagion network queries.

Graceful degradation: if NEO4J_URI is not configured, all methods
return empty results without crashing.
"""

import structlog
from typing import Optional
from src.core.config import settings

logger = structlog.get_logger()


class GraphService:
    """
    Neo4j-backed entity relationship graph.

    Schema:
        (:Company {ch_number, name, risk_tier, region, tenant_id})
        (:Person  {name, date_of_birth, nationality, person_hash})
        (:Company)-[:HAS_DIRECTOR {appointed, resigned}]->(:Person)
        (:Person)-[:PSC_OF {nature_of_control}]->(:Company)
        (:Company)-[:SHARES_DIRECTOR {shared_count}]->(:Company)
    """

    def __init__(self):
        self.driver = None
        self._available = False

        if not settings.NEO4J_URI:
            logger.warning(
                "GraphService: NEO4J_URI not configured — running in degraded mode"
            )
            return

        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            self._available = True
            logger.info("GraphService initialised", uri=settings.NEO4J_URI)
        except Exception as e:
            logger.warning(
                "GraphService: Neo4j unavailable — degraded mode",
                error=str(e),
            )
            self.driver = None

    @property
    def available(self) -> bool:
        return self._available and self.driver is not None

    def close(self):
        if self.driver:
            self.driver.close()

    # ── Node Upserts ───────────────────────────────────────────

    def upsert_company_node(
        self,
        ch_number: str,
        name: str,
        risk_tier: str = "UNSCORED",
        region: str = "",
        tenant_id: str = "",
    ) -> bool:
        """
        MERGE a :Company node by ch_number. Updates properties on match.
        Returns True if operation succeeded.
        """
        if not self.available:
            return False

        query = """
        MERGE (c:Company {ch_number: $ch_number})
        ON CREATE SET
            c.name = $name,
            c.risk_tier = $risk_tier,
            c.region = $region,
            c.tenant_id = $tenant_id,
            c.created_at = datetime()
        ON MATCH SET
            c.name = $name,
            c.risk_tier = $risk_tier,
            c.region = $region,
            c.updated_at = datetime()
        RETURN c.ch_number AS ch_number
        """
        try:
            with self.driver.session() as session:
                result = session.run(
                    query,
                    ch_number=ch_number,
                    name=name,
                    risk_tier=risk_tier,
                    region=region,
                    tenant_id=tenant_id,
                )
                result.consume()
                logger.debug("Graph: upserted company", ch_number=ch_number)
                return True
        except Exception as e:
            logger.error("Graph: failed to upsert company", error=str(e))
            return False

    def upsert_person_node(
        self,
        name: str,
        date_of_birth: str = "",
        nationality: str = "",
        person_hash: str = "",
    ) -> bool:
        """
        MERGE a :Person node by person_hash (or name if no hash).
        """
        if not self.available:
            return False

        merge_key = person_hash or name
        query = """
        MERGE (p:Person {person_hash: $merge_key})
        ON CREATE SET
            p.name = $name,
            p.date_of_birth = $date_of_birth,
            p.nationality = $nationality,
            p.created_at = datetime()
        ON MATCH SET
            p.name = $name,
            p.updated_at = datetime()
        RETURN p.person_hash AS person_hash
        """
        try:
            with self.driver.session() as session:
                result = session.run(
                    query,
                    merge_key=merge_key,
                    name=name,
                    date_of_birth=date_of_birth,
                    nationality=nationality,
                )
                result.consume()
                logger.debug("Graph: upserted person", name=name)
                return True
        except Exception as e:
            logger.error("Graph: failed to upsert person", error=str(e))
            return False

    # ── Edge Upserts ───────────────────────────────────────────

    def upsert_director_edge(
        self,
        ch_number: str,
        person_hash: str,
        appointed: str = "",
        resigned: str = "",
    ) -> bool:
        """
        MERGE a :HAS_DIRECTOR relationship from Company to Person.
        """
        if not self.available:
            return False

        query = """
        MATCH (c:Company {ch_number: $ch_number})
        MATCH (p:Person {person_hash: $person_hash})
        MERGE (c)-[r:HAS_DIRECTOR]->(p)
        ON CREATE SET
            r.appointed = $appointed,
            r.resigned = $resigned
        ON MATCH SET
            r.resigned = $resigned
        RETURN type(r) AS rel_type
        """
        try:
            with self.driver.session() as session:
                result = session.run(
                    query,
                    ch_number=ch_number,
                    person_hash=person_hash,
                    appointed=appointed,
                    resigned=resigned,
                )
                result.consume()
                return True
        except Exception as e:
            logger.error("Graph: failed to upsert director edge", error=str(e))
            return False

    def upsert_psc_edge(
        self,
        person_hash: str,
        ch_number: str,
        nature_of_control: str = "",
    ) -> bool:
        """
        MERGE a :PSC_OF relationship from Person to Company.
        """
        if not self.available:
            return False

        query = """
        MATCH (p:Person {person_hash: $person_hash})
        MATCH (c:Company {ch_number: $ch_number})
        MERGE (p)-[r:PSC_OF]->(c)
        ON CREATE SET
            r.nature_of_control = $nature_of_control
        RETURN type(r) AS rel_type
        """
        try:
            with self.driver.session() as session:
                result = session.run(
                    query,
                    person_hash=person_hash,
                    ch_number=ch_number,
                    nature_of_control=nature_of_control,
                )
                result.consume()
                return True
        except Exception as e:
            logger.error("Graph: failed to upsert PSC edge", error=str(e))
            return False

    # ── Contagion Queries ──────────────────────────────────────

    def get_contagion_network(self, ch_number: str) -> dict:
        """
        Execute a 2-hop Cypher query to find companies linked via
        shared directors or PSCs. Returns a graph payload suitable
        for the ContagionMap frontend component.

        Returns:
            {
                "target": {"ch_number": ..., "name": ..., "risk_tier": ...},
                "nodes": [{"id": ..., "label": ..., "type": "Company"|"Person", ...}],
                "links": [{"source": ..., "target": ..., "type": ...}],
            }
        """
        if not self.available:
            return {"target": None, "nodes": [], "links": []}

        query = """
        // Find the target company
        MATCH (target:Company {ch_number: $ch_number})

        // 2-hop via directors
        OPTIONAL MATCH (target)<-[:HAS_DIRECTOR]-(target)-[d:HAS_DIRECTOR]->(person:Person)
        OPTIONAL MATCH (linked_d:Company)-[:HAS_DIRECTOR]->(person)
        WHERE linked_d.ch_number <> target.ch_number

        // 2-hop via PSCs
        OPTIONAL MATCH (psc:Person)-[:PSC_OF]->(target)
        OPTIONAL MATCH (psc)-[:PSC_OF]->(linked_p:Company)
        WHERE linked_p.ch_number <> target.ch_number

        WITH target,
             COLLECT(DISTINCT person) AS directors,
             COLLECT(DISTINCT linked_d) AS dir_linked,
             COLLECT(DISTINCT psc) AS pscs,
             COLLECT(DISTINCT linked_p) AS psc_linked

        RETURN target,
               directors,
               dir_linked,
               pscs,
               psc_linked
        """
        try:
            with self.driver.session() as session:
                result = session.run(query, ch_number=ch_number)
                record = result.single()

                if not record or not record["target"]:
                    return {"target": None, "nodes": [], "links": []}

                return self._build_graph_payload(record)
        except Exception as e:
            logger.error("Graph: contagion query failed", error=str(e))
            return {"target": None, "nodes": [], "links": []}

    def _build_graph_payload(self, record) -> dict:
        """Transform a Neo4j record into a frontend-consumable graph."""
        target_node = record["target"]
        target = {
            "ch_number": target_node["ch_number"],
            "name": target_node.get("name", "Unknown"),
            "risk_tier": target_node.get("risk_tier", "UNSCORED"),
        }

        nodes = []
        links = []
        seen_ids = set()

        # Add target company
        target_id = f"co-{target['ch_number']}"
        nodes.append({
            "id": target_id,
            "label": target["name"],
            "type": "Company",
            "risk_tier": target["risk_tier"],
            "is_target": True,
        })
        seen_ids.add(target_id)

        # Add directors + links
        for person in record.get("directors", []):
            if person is None:
                continue
            pid = f"p-{person.get('person_hash', person.get('name', ''))}"
            if pid not in seen_ids:
                nodes.append({
                    "id": pid,
                    "label": person.get("name", "Unknown"),
                    "type": "Person",
                })
                seen_ids.add(pid)
            links.append({"source": target_id, "target": pid, "type": "DIRECTOR"})

        # Add director-linked companies
        for company in record.get("dir_linked", []):
            if company is None:
                continue
            cid = f"co-{company['ch_number']}"
            if cid not in seen_ids:
                nodes.append({
                    "id": cid,
                    "label": company.get("name", "Unknown"),
                    "type": "Company",
                    "risk_tier": company.get("risk_tier", "UNSCORED"),
                    "is_target": False,
                })
                seen_ids.add(cid)

        # Add PSCs + links
        for psc in record.get("pscs", []):
            if psc is None:
                continue
            pid = f"p-{psc.get('person_hash', psc.get('name', ''))}"
            if pid not in seen_ids:
                nodes.append({
                    "id": pid,
                    "label": psc.get("name", "Unknown"),
                    "type": "Person",
                })
                seen_ids.add(pid)
            links.append({"source": pid, "target": target_id, "type": "PSC"})

        # Add PSC-linked companies
        for company in record.get("psc_linked", []):
            if company is None:
                continue
            cid = f"co-{company['ch_number']}"
            if cid not in seen_ids:
                nodes.append({
                    "id": cid,
                    "label": company.get("name", "Unknown"),
                    "type": "Company",
                    "risk_tier": company.get("risk_tier", "UNSCORED"),
                    "is_target": False,
                })
                seen_ids.add(cid)

        return {"target": target, "nodes": nodes, "links": links}


# Singleton
graph_service = GraphService()
