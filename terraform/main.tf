### FILE: terraform/main.tf
provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true            # <--- FIX: Forces correct API quota usage
  billing_project       = var.project_id  # <--- FIX: explicit billing project
}

# 0. Cost Guardrails (Budget Alert)
data "google_billing_account" "account" {
  billing_account = var.billing_account
}

resource "google_billing_budget" "budget" {
  billing_account = data.google_billing_account.account.id
  display_name    = "Newsletter Engine Budget"

  amount {
    specified_amount {
      currency_code = "GBP"
      units         = "40"
    }
  }

  threshold_rules {
    threshold_percent = 0.8
  }
}

# 1. Database: Cloud SQL (Postgres)
resource "google_sql_database_instance" "main" {
  name             = "newsletter-engine-db"
  database_version = "POSTGRES_15"
  region           = var.region
  settings {
    tier = "db-f1-micro"
  }
}

# 2. Storage: Raw Files
resource "google_storage_bucket" "raw_source_bucket" {
  name                        = "${var.project_id}-raw-sources"
  location                    = var.region
  uniform_bucket_level_access = true
}

# 3. Pub/Sub
resource "google_pubsub_topic" "ingestion_topic" {
  name = "newsletter-ingestion"
}

# 4. Vertex AI: Vector Index
resource "google_vertex_ai_index" "newsletter_index" {
  display_name = "newsletter-source-index"
  description  = "Vector embeddings of client content"
  metadata {
    config {
      dimensions = 768 
      approximate_neighbors_count = 150
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count    = 500
          leaf_nodes_to_search_percent = 7
        }
      }
    }
  }
}