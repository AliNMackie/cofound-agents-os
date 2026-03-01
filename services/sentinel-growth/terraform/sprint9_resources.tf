# --- Pub/Sub ---
resource "google_pubsub_topic" "signals_topic" {
  name = "ic-origin-signals"
}

# --- BigQuery ---
resource "google_bigquery_dataset" "ic_origin_dataset" {
  dataset_id                 = "ic_origin"
  friendly_name              = "IC Origin Production"
  description                = "Analytics warehouse for IC Origin signals and audit logs"
  location                   = var.region
  delete_contents_on_destroy = false
}

resource "google_bigquery_table" "fact_signals" {
  dataset_id          = google_bigquery_dataset.ic_origin_dataset.dataset_id
  table_id            = "fact_signals"
  deletion_protection = false

  schema = <<EOF
[
  {
    "name": "signal_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "tenant_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "timestamp",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "entity_id",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "source_family",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "signal_type",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "conviction_score",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "payload",
    "type": "JSON",
    "mode": "NULLABLE"
  }
]
EOF
}

# --- Secret Manager (Placeholder for Neo4j) ---
resource "google_secret_manager_secret" "neo4j_uri" {
  secret_id = "neo4j-uri"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "neo4j_uri_v1" {
  secret      = google_secret_manager_secret.neo4j_uri.id
  secret_data = "bolt://localhost:7687" # Placeholder
}

resource "google_secret_manager_secret" "neo4j_password" {
  secret_id = "neo4j-password"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "neo4j_password_v1" {
  secret      = google_secret_manager_secret.neo4j_password.id
  secret_data = "placeholder-password" # Placeholder
}
