terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Enable Required Services
resource "google_project_service" "project_services" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com"
  ])

  service            = each.key
  disable_on_destroy = false
}

# 2. Create the Service Account for the Agent Runtime
resource "google_service_account" "agent_runtime_sa" {
  account_id   = "travel-agent-runtime"
  display_name = "Service Account for the Travel Agent"
}

# 3. Create the Firestore Database
resource "google_firestore_database" "database" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Wait for the Firestore API to be enabled
  depends_on = [google_project_service.project_services]
}

# 4. Create Secrets for OAuth Credentials
resource "google_secret_manager_secret" "google_client_id" {
  secret_id = "google-client-id"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "google_client_secret" {
  secret_id = "google-client-secret"
  replication {
    auto {}
  }
}

# 5. Add Secret Versions
resource "google_secret_manager_secret_version" "client_id_version" {
  secret      = google_secret_manager_secret.google_client_id.id
  secret_data = var.google_client_id_value
}

resource "google_secret_manager_secret_version" "client_secret_version" {
  secret      = google_secret_manager_secret.google_client_secret.id
  secret_data = var.google_client_secret_value
}

# 6. Create the Cloud Run Service
resource "google_cloud_run_v2_service" "agent_service" {
  name     = "travel-agent-service"
  location = var.region

  template {
    service_account = google_service_account.agent_runtime_sa.email

    scaling {
      min_instance_count = 1
    }

    containers {
      image = "gcr.io/${var.project_id}/travel-agent:latest" # Placeholder image
      ports {
        container_port = 8080
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "FIRESTORE_DB"
        value = google_firestore_database.database.name
      }
    }
  }

  # Wait for all services to be enabled
  depends_on = [google_project_service.project_services]
}
