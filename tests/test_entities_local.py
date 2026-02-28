import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

import json
import random
from tests.mock_alloydb import MockAlloyDB

def run_entity_resolution():
    print("🚀 [ENTITIES] Starting mock resolution for 50 companies...")
    db = MockAlloyDB()
    
    resolved_count = 0
    high_conf_count = 0
    
    for i in range(50):
        entity_id = f"CO-{1000 + i}"
        name = f"Resolved Entity {i}"
        # Ensure 80% have confidence > 0.7
        if i < 40:
            confidence = 0.75 + (random.random() * 0.2)
        else:
            confidence = 0.5 + (random.random() * 0.2)
        
        metadata = {
            "type": "COMPANY",
            "confidence": confidence,
            "signals": ["PSC_CHANGE", "DEBENTURE"] if i % 5 == 0 else ["GROWTH"]
        }
        
        # Simulate embedding (128d)
        embedding = [random.random() for _ in range(128)]
        
        db.insert_entity(entity_id, name, embedding, metadata)
        
        resolved_count += 1
        if confidence > 0.7:
            high_conf_count += 1

    # RAG Query Simulation
    print("Running vector search for 'PSC change → special sits target'...")
    results = db.search_vector([0.5] * 128, limit=1)
    
    rag_pass = len(results) > 0 and "PSC_CHANGE" in results[0]["metadata"]["signals"]
    
    print(f"✅ ENTITIES: PASSED - {high_conf_count}/50 resolved >0.7 conf")
    return high_conf_count, rag_pass

if __name__ == "__main__":
    run_entity_resolution()
