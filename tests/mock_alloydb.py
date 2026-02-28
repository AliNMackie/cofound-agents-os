import sqlite3
import json

class MockAlloyDB:
    def __init__(self, db_path="tests/mock_alloydb.sqlite"):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path)
        self._create_schema()

    def _create_schema(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS entities (
                entity_id TEXT PRIMARY KEY,
                canonical_name TEXT,
                embedding TEXT,  -- JSON string of floats for pgvector simulation
                metadata TEXT
            )
        """)
        self.conn.commit()

    def insert_entity(self, entity_id, name, embedding, metadata):
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO entities (entity_id, canonical_name, embedding, metadata) VALUES (?, ?, ?, ?)",
            (entity_id, name, json.dumps(embedding), json.dumps(metadata))
        )
        self.conn.commit()

    def search_vector(self, query_embedding, limit=5):
        # Very simple simulation of vector search (cosine similarity dummy)
        cursor = self.conn.cursor()
        cursor.execute("SELECT entity_id, canonical_name, metadata FROM entities")
        rows = cursor.fetchall()
        
        # In a real pgvector mock, we'd do vector math, 
        # but for dry-run simulation, just returning data is fine.
        results = []
        for row in rows:
            results.append({
                "entity_id": row[0],
                "name": row[1],
                "metadata": json.loads(row[2]),
                "score": 0.95 # Simulated score
            })
        return results[:limit]
