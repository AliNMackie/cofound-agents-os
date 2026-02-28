terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

variable "google_api_key" {
  description = "Google API Key for Vertex AI (optional for dormant phase)"
  type        = string
  default     = "placeholder-key-dormant"
}

# --- Service Account ---
resource "google_service_account" "sentinel_sa" {
  account_id   = "sentinel-growth-sa"
  display_name = "Service Account for Sentinel Growth Service"
}

# --- Artifact Registry ---
resource "google_artifact_registry_repository" "sentinel_repo" {
  location      = var.region
  repository_id = "sentinel-repo"
  description   = "Docker repository for Sentinel Growth"
  format        = "DOCKER"
}

# --- Storage Bucket (Document Vault) ---
resource "google_storage_bucket" "vault" {
  name                        = var.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false # Safety: Do not delete if not empty

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }
}

# --- IAM Bindings ---
# Grant SA permission to create objects in the specific bucket
resource "google_storage_bucket_iam_member" "sa_storage_creator" {
  bucket = google_storage_bucket.vault.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.sentinel_sa.email}"
}

# Grant SA permission to sign blobs (Required for V4 Signed URLs)
resource "google_project_iam_member" "sa_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.sentinel_sa.email}"
}

# Grant SA permission to use Vertex AI (Gemini)
resource "google_project_iam_member" "sa_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.sentinel_sa.email}"
}

# Grant SA permission to access secrets from Secret Manager
resource "google_project_iam_member" "sa_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.sentinel_sa.email}"
}

# --- Cloud Run Service (V2) ---
resource "google_cloud_run_v2_service" "sentinel_v2" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
    
    service_account = google_service_account.sentinel_sa.email

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.vault.name
      }
      env {
        name  = "PUBSUB_TOPIC_ID"
        value = google_pubsub_topic.signals_topic.name
      }
      env {
        name  = "FIRESTORE_DB_NAME"
        value = "(default)"
      }
      
      # Secret references
      env {
        name = "NEO4J_URI"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.neo4j_uri.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "NEO4J_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.neo4j_password.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }
    }
  }
}

# --- Audit Logs ---
# Configure Retention for Default Logs Bucket to 365 days (1 year)
resource "google_logging_project_bucket_config" "default_log_bucket" {
    project        = var.project_id
    location       = "global" # _Default bucket is global
    bucket_id      = "_Default"
    retention_days = 365
}
