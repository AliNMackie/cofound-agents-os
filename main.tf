terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "apis" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudscheduler.googleapis.com",
    "gmail.googleapis.com",
    "aiplatform.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}
# Secure Database (The Brain)
resource "google_firestore_database" "database" {
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = var.region
  type                        = "FIRESTORE_NATIVE"
  delete_protection_state     = "DELETE_PROTECTION_ENABLED"
}

# Secure Vault (Secret Manager)
resource "google_secret_manager_secret" "outlook_client_id" {
  secret_id = "outlook_client_id"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "outlook_client_id_version" {
  secret      = google_secret_manager_secret.outlook_client_id.id
  secret_data = var.outlook_client_id
}

resource "google_secret_manager_secret" "outlook_client_secret" {
  secret_id = "outlook_client_secret"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "outlook_client_secret_version" {
  secret      = google_secret_manager_secret.outlook_client_secret.id
  secret_data = var.outlook_client_secret
}

resource "google_secret_manager_secret" "outlook_tenant_id" {
  secret_id = "outlook_tenant_id"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "outlook_tenant_id_version" {
  secret      = google_secret_manager_secret.outlook_tenant_id.id
  secret_data = var.outlook_tenant_id
}

resource "google_secret_manager_secret" "session_secret_key" {
  secret_id = "session_secret_key"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "session_secret_key_version" {
  secret      = google_secret_manager_secret.session_secret_key.id
  secret_data = var.session_secret_key
}

# Private Source Bucket
resource "google_storage_bucket" "function_source_bucket" {
  name                        = "${var.project_id}-function-source"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  versioning {
    enabled = true
  }
}
# IAM & Identity
resource "google_service_account" "agent_identity" {
  account_id   = "agent-identity"
  display_name = "Agent Identity"
}

resource "google_project_iam_member" "agent_datastore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = google_service_account.agent_identity.member
}

resource "google_project_iam_member" "agent_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = google_service_account.agent_identity.member
}

resource "google_project_iam_member" "agent_ai_platform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = google_service_account.agent_identity.member
}
# Worker Function (The Private Agent)
resource "google_pubsub_topic" "agent_work_topic" {
  name = "agent-work-topic"
}

resource "google_storage_bucket_object" "function_source_zip" {
  name   = "function_source.zip"
  bucket = google_storage_bucket.function_source_bucket.name
  source = "function_source.zip"
}

resource "google_cloudfunctions2_function" "process_user_inbox" {
  name     = "process-user-inbox"
  location = var.region
  build_config {
    runtime     = "python311"
    entry_point = "handler"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source_bucket.name
        object = google_storage_bucket_object.function_source_zip.name
      }
    }
  }
  service_config {
    max_instance_count = 1
    min_instance_count = 0
    available_memory   = "256Mi"
    timeout_seconds    = 60
    ingress_settings   = "ALLOW_INTERNAL_ONLY"
    service_account_email = google_service_account.agent_identity.email
    environment_variables = {
      PROJECT_ID         = var.project_id
      MAIL_PROVIDER_TYPE = "MULTI"
    }
    secret_environment_variables {
      key        = "OUTLOOK_CLIENT_SECRET"
      project_id = var.project_id
      secret     = "outlook_client_secret"
      version    = "latest"
    }
    secret_environment_variables {
      key        = "OUTLOOK_CLIENT_ID"
      project_id = var.project_id
      secret     = "outlook_client_id"
      version    = "latest"
    }
    secret_environment_variables {
      key        = "OUTLOOK_TENANT_ID"
      project_id = var.project_id
      secret     = "outlook_tenant_id"
      version    = "latest"
    }
    secret_environment_variables {
      key        = "SECRET_KEY"
      project_id = var.project_id
      secret     = "session_secret_key"
      version    = "latest"
    }
  }
  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.agent_work_topic.id
  }
}
# Onboarding API (The Public Facade)
resource "google_cloud_run_v2_service" "onboarding_api" {
  name     = "onboarding-api"
  location = var.region
  template {
    service_account = google_service_account.agent_identity.email
    containers {
      # The user must build and push their own image and provide the name in the `onboarding_api_image` variable.
      image = var.onboarding_api_image
      ports {
        container_port = 8080
      }
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name = "OUTLOOK_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.outlook_client_id.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "OUTLOOK_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.outlook_client_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "OUTLOOK_TENANT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.outlook_tenant_id.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.session_secret_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }
  ingress = "INGRESS_TRAFFIC_ALL"
}
# Scheduler (The Heartbeat)
resource "google_cloud_scheduler_job" "agent_heartbeat" {
  name             = "agent-heartbeat"
  schedule         = "*/15 * * * *"
  time_zone        = "Etc/UTC"
  pubsub_target {
    topic_name = google_pubsub_topic.agent_work_topic.id
    data       = base64encode("trigger")
    oidc_token {
      service_account_email = google_service_account.agent_identity.email
    }
  }
}
