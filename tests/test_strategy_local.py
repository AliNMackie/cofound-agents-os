import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

import json
import importlib.util
import sys

# Load the orchestrator app from the hyphenated directory
spec = importlib.util.spec_from_file_location("orchestrator", "services/ic-origin-orchestrator/main.py")
orchestrator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(orchestrator)
app = orchestrator.app

from fastapi.testclient import TestClient

def run_strategy_test():
    print("🚀 [STRATEGY] Testing /strategize?entity=ABC123...")
    client = TestClient(app)
    
    response = client.post("/strategize", json={"entity_id": "ABC123"})
    
    if response.status_code != 200:
        print(f"FAILED: {response.text}")
        return False
        
    data = response.json()
    
    # Assertions
    has_views = len(data["strategies"]) > 0
    has_memo = len(data["memo_snippet"]) > 0
    
    if has_views and has_memo:
        print(f"✅ STRATEGY: PASSED - {len(data['strategies'])} strategies generated")
        return True
    
    print("FAILED: Strategies or Memo missing.")
    return False

if __name__ == "__main__":
    run_strategy_test()
