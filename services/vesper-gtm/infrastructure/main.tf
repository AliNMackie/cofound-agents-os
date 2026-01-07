provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable necessary APIs (Best practice, though assumes user has permissions)
resource "google_project_service" "cloudrun" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "scheduler" {
  service = "cloudscheduler.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager" {
  service = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# --- Service Accounts ---

resource "google_service_account" "vesper_sa" {
  account_id   = "vesper-n8n-sa"
  display_name = "Vesper n8n Service Account"
}

resource "google_service_account" "scheduler_sa" {
  account_id   = "vesper-scheduler-sa"
  display_name = "Vesper Scheduler Service Account"
}

# --- Secrets ---

resource "google_secret_manager_secret" "linkedin_token" {
  secret_id = "LINKEDIN_TOKEN"
  replication {
    auto {}
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "OPENAI_API_KEY"
  replication {
    auto {}
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret" "unipile_dsn" {
  secret_id = "UNIPILE_DSN"
  replication {
    auto {}
  }
  depends_on = [google_project_service.secretmanager]
}

# --- Firestore ---

resource "google_firestore_database" "database" {
  name                    = "(default)"
  location_id             = var.region
  type                    = "FIRESTORE_NATIVE"
  delete_protection_state = "DELETE_PROTECTION_ENABLED"

  depends_on = [google_project_service.firestore]
}

# --- IAM Permissions ---

# Cloud Run SA needs to access Firestore
resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.vesper_sa.email}"
}

# Scheduler SA needs to invoke Cloud Run
resource "google_cloud_run_service_iam_member" "invoker" {
  service  = google_cloud_run_v2_service.vesper_n8n.name
  location = google_cloud_run_v2_service.vesper_n8n.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

# --- Cloud Run ---

resource "google_cloud_run_v2_service" "vesper_n8n" {
  name     = "vesper-n8n"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.vesper_sa.email

    containers {
      image = "n8n/n8n:latest"
      
      env {
        name  = "GENERIC_TIMEZONE"
        value = "Europe/London"
      }
      
      env {
        name  = "WEBHOOK_URL"
        value = var.webhook_url
      }
      
      # Assuming n8n needs a port, defaults to 5678 usually. Cloud Run defaults to checking 8080.
      # n8n typically listens on 5678.
      ports {
        container_port = 5678
      }
    }
  }

  depends_on = [google_project_service.cloudrun]
}

# --- Cloud Scheduler ---

resource "google_cloud_scheduler_job" "vesper_heartbeat" {
  name             = "vesper-heartbeat"
  description      = "Heartbeat for Vesper n8n"
  schedule         = "*/15 * * * *"
  time_zone        = "Europe/London"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = google_cloud_run_v2_service.vesper_n8n.uri

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  depends_on = [google_project_service.scheduler]
}
