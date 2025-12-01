terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
  }
}

provider "google" {
  region = "us-central1"
}

variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

# 1. Firestore Native database in 'us-central1'
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = "us-central1"
  type        = "FIRESTORE_NATIVE"
}

# 2. Cloud Tasks queue named 'invoice-processing-queue'
resource "google_cloud_tasks_queue" "invoice_processing_queue" {
  project  = var.project_id
  name     = "invoice-processing-queue"
  location = "us-central1"

  retry_config {
    max_attempts = 5
  }
}

# 3. Service Account named 'invoice-agent-sa'
resource "google_service_account" "invoice_agent_sa" {
  project      = var.project_id
  account_id   = "invoice-agent-sa"
  display_name = "Invoice Agent Service Account"
}

# Permissions: Enqueue tasks
resource "google_project_iam_member" "sa_cloud_tasks_enqueuer" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.invoice_agent_sa.email}"
}

# Permissions: Write to Firestore
resource "google_project_iam_member" "sa_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.invoice_agent_sa.email}"
}

# 4. Secret Manager secrets
resource "google_secret_manager_secret" "stripe_secret_key" {
  project   = var.project_id
  secret_id = "stripe-secret-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "stripe_webhook_secret" {
  project   = var.project_id
  secret_id = "stripe-webhook-secret"

  replication {
    auto {}
  }
}
