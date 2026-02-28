import json
import os

class MockBigQuery:
    def __init__(self, storage_path="tests/mock_bq_storage.json"):
        self.storage_path = storage_path
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, "w") as f:
                json.dump({"raw_signals": [], "auctions_enhanced": []}, f)

    def insert_rows(self, table_id, rows):
        with open(self.storage_path, "r") as f:
            data = json.load(f)
        
        data[table_id].extend(rows)
        
        with open(self.storage_path, "w") as f:
            json.dump(data, f, indent=2)
        
        return True

    def query(self, query_str):
        # Very simple mock query support
        with open(self.storage_path, "r") as f:
            data = json.load(f)
        
        if "FROM raw_signals" in query_str:
            return data["raw_signals"]
        if "FROM auctions_enhanced" in query_str:
            return data["auctions_enhanced"]
        return []

    def get_table_count(self, table_id):
        with open(self.storage_path, "r") as f:
            data = json.load(f)
        return len(data.get(table_id, []))
