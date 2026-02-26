import json
import random
import uuid
from datetime import datetime, timedelta

def generate_mock_filings(count=1000):
    filings = []
    for i in range(count):
        company_number = f"{random.randint(10000000, 99999999)}"
        filings.append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "source_family": "COMPANIES_HOUSE",
            "signal_type": random.choice(["GROWTH", "RESCUE"]),
            "entity_name": f"Mock Company {i}",
            "entity_id": company_number,
            "raw_content": json.dumps({"filing_type": "PSC_CHANGE", "barcode": f"B-{i}"}),
            "metadata": {"relevance": random.random()}
        })
    return filings

def generate_mock_rss(count=100):
    items = []
    for i in range(count):
        items.append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "source_family": "REGIONAL_RSS",
            "signal_type": random.choice(["GROWTH", "RESCUE"]),
            "entity_name": f"Regional Target {i}",
            "entity_id": None,
            "raw_content": f"Breaking news about a potential acquisition in the North West for Target {i}.",
            "metadata": {"source": "Boutique Feed X"}
        })
    return items

if __name__ == "__main__":
    data = {
        "filings": generate_mock_filings(),
        "rss": generate_mock_rss()
    }
    with open("tests/mock_signals.json", "w") as f:
        json.dump(data, f, indent=2)
    print(f"Generated {len(data['filings'])} filings and {len(data['rss'])} RSS items.")
