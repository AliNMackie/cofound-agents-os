terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "europe-west2"
}

variable "project_id" {
  description = "The Google Cloud project ID."
  type        = string
}

variable "mail_provider_type" {
  description = "The email provider type: GMAIL or OUTLOOK."
  type        = string
  default     = "GMAIL"
}

variable "outlook_target_user_email" {
  description = "The target user email for Outlook provider (only required if mail_provider_type is OUTLOOK)."
  type        = string
  default     = ""
}

resource "google_project_service" "project_services" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "aiplatform.googleapis.com",
    "gmail.googleapis.com",
    "cloudbuild.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  service = each.key

  disable_on_destroy = false
}

resource "google_firestore_database" "database" {
  name                = "(default)"
  location            = "europe-west2"
  type                = "NATIVE"
  deletion_protection = true

  depends_on = [google_project_service.project_services]
}

resource "google_service_account" "function_sa" {
  account_id   = "gmail-agent-sa"
  display_name = "Gmail Agent Service Account"
}

resource "google_service_account" "scheduler_sa" {
  account_id   = "gmail-scheduler-sa"
  display_name = "Gmail Scheduler Service Account"
}

resource "google_project_iam_member" "sa_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/aiplatform.user",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}

# Secret Manager secrets for Outlook credentials
resource "google_secret_manager_secret" "outlook_client_id" {
  secret_id = "outlook-client-id"

  replication {
    auto {}
  }

  depends_on = [google_project_service.project_services]
}

resource "google_secret_manager_secret" "outlook_client_secret" {
  secret_id = "outlook-client-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.project_services]
}

resource "google_secret_manager_secret" "outlook_tenant_id" {
  secret_id = "outlook-tenant-id"

  replication {
    auto {}
  }

  depends_on = [google_project_service.project_services]
}

# Grant service account access to secrets
resource "google_secret_manager_secret_iam_member" "outlook_client_id_access" {
  secret_id = google_secret_manager_secret.outlook_client_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.function_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "outlook_client_secret_access" {
  secret_id = google_secret_manager_secret.outlook_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.function_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "outlook_tenant_id_access" {
  secret_id = google_secret_manager_secret.outlook_tenant_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.function_sa.email}"
}

resource "google_project_iam_member" "scheduler_invoker_role" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_storage_bucket" "source_bucket" {
  name                        = "${var.project_id}-gmail-agent-source"
  location                    = "EUROPE-WEST2"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }
}

resource "google_cloudfunctions2_function" "gmail_agent_function" {
  name     = "gmail-agent-v1"
  location = "europe-west2"

  build_config {
    runtime     = "python311"
    entry_point = "handler" # Assuming the entry point is named 'handler'
    source {
      storage_source {
        bucket = google_storage_bucket.source_bucket.name
        # The object will be uploaded by the CI/CD pipeline
      }
    }
  }

  service_config {
    max_instance_count = 1
    min_instance_count = 0
    available_memory   = "256Mi"
    timeout_seconds    = 60
    environment_variables = merge(
      {
        PROJECT_ID         = var.project_id
        LOG_LEVEL          = "INFO"
        MAIL_PROVIDER_TYPE = var.mail_provider_type
      },
      var.mail_provider_type == "OUTLOOK" && var.outlook_target_user_email != "" ? {
        OUTLOOK_TARGET_USER_EMAIL = var.outlook_target_user_email
      } : {}
    )

    # Secret environment variables for Outlook credentials
    dynamic "secret_environment_variables" {
      for_each = var.mail_provider_type == "OUTLOOK" ? [1] : []
      content {
        key        = "OUTLOOK_CLIENT_ID"
        project_id = var.project_id
        secret     = google_secret_manager_secret.outlook_client_id.secret_id
        version    = "latest"
      }
    }

    dynamic "secret_environment_variables" {
      for_each = var.mail_provider_type == "OUTLOOK" ? [1] : []
      content {
        key        = "OUTLOOK_CLIENT_SECRET"
        project_id = var.project_id
        secret     = google_secret_manager_secret.outlook_client_secret.secret_id
        version    = "latest"
      }
    }

    dynamic "secret_environment_variables" {
      for_each = var.mail_provider_type == "OUTLOOK" ? [1] : []
      content {
        key        = "OUTLOOK_TENANT_ID"
        project_id = var.project_id
        secret     = google_secret_manager_secret.outlook_tenant_id.secret_id
        version    = "latest"
      }
    }

    service_account_email = google_service_account.function_sa.email
    ingress_settings      = "ALLOW_INTERNAL_ONLY"
  }

  depends_on = [google_project_service.project_services]
}

resource "google_cloud_scheduler_job" "trigger_job" {
  name             = "trigger-gmail-agent-job"
  schedule         = "*/15 * * * *" # Every 15 minutes
  time_zone        = "Etc/UTC"
  attempt_deadline = "320s"

  http_target {
    uri         = google_cloudfunctions2_function.gmail_agent_function.service_config[0].uri
    http_method = "POST"
    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  depends_on = [google_project_service.project_services]
}
