provider "google" {
  project = var.project_id
  region  = var.region
}

# --- 2. Infrastructure Standards ---
# Region: europe-west2 (London) is set in variables.tf default.

# --- Secret Manager ---
resource "google_secret_manager_secret" "stripe_api_key" {
  secret_id = "stripe-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_api_key_val" {
  secret = google_secret_manager_secret.stripe_api_key.id
  secret_data = var.stripe_api_key
}

resource "google_secret_manager_secret" "stripe_webhook_secret" {
  secret_id = "stripe-webhook-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_webhook_secret_val" {
  secret = google_secret_manager_secret.stripe_webhook_secret.id
  secret_data = var.stripe_webhook_secret
}

resource "google_secret_manager_secret" "sendgrid_api_key" {
  secret_id = "sendgrid-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "sendgrid_api_key_val" {
  secret = google_secret_manager_secret.sendgrid_api_key.id
  secret_data = var.sendgrid_api_key
}

resource "google_secret_manager_secret" "twilio_account_sid" {
  secret_id = "twilio-account-sid"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_account_sid_val" {
  secret = google_secret_manager_secret.twilio_account_sid.id
  secret_data = var.twilio_account_sid
}

resource "google_secret_manager_secret" "twilio_auth_token" {
  secret_id = "twilio-auth-token"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_auth_token_val" {
  secret = google_secret_manager_secret.twilio_auth_token.id
  secret_data = var.twilio_auth_token
}

# --- Service Accounts ---
# Identity: Every service must run as a dedicated Service Account.

resource "google_service_account" "stripe_webhook_sa" {
  account_id   = "stripe-webhook-sa"
  display_name = "Stripe Webhook Service Account"
}

resource "google_service_account" "nudge_worker_sa" {
  account_id   = "nudge-worker-sa"
  display_name = "Nudge Worker Service Account"
}

resource "google_service_account" "scheduler_nudge_sa" {
  account_id   = "scheduler-nudge-sa"
  display_name = "Scheduler Nudge Service Account"
}

resource "google_service_account" "delivery_agent_sa" {
  account_id   = "delivery-agent-sa"
  display_name = "Delivery Agent Service Account"
}

resource "google_service_account" "onboarding_contract_processor_sa" {
  account_id   = "onboarding-cp-sa"
  display_name = "Onboarding Contract Processor Service Account"
}

# --- IAM ---
# Minimum privilege.

# Stripe Webhook needs Firestore write access
resource "google_project_iam_member" "stripe_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.stripe_webhook_sa.email}"
}

# Smart Nudge Worker needs Firestore read/write
resource "google_project_iam_member" "nudge_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.nudge_worker_sa.email}"
}

# Delivery Agent needs Firestore write
resource "google_project_iam_member" "delivery_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.delivery_agent_sa.email}"
}

# Contract Processor needs Firestore, Run Invoker, Secret Access
resource "google_project_iam_member" "cp_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.onboarding_contract_processor_sa.email}"
}

resource "google_project_iam_member" "cp_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.onboarding_contract_processor_sa.email}"
}

# Allow Secret Access
resource "google_secret_manager_secret_iam_member" "stripe_key_access" {
  secret_id = google_secret_manager_secret.stripe_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.stripe_webhook_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "cp_twilio_sid_access" {
  secret_id = google_secret_manager_secret.twilio_account_sid.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.onboarding_contract_processor_sa.email}"
}

# Nudge Worker needs Secret Access
resource "google_secret_manager_secret_iam_member" "nudge_twilio_sid_access" {
  secret_id = google_secret_manager_secret.twilio_account_sid.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.nudge_worker_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "nudge_twilio_token_access" {
  secret_id = google_secret_manager_secret.twilio_auth_token.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.nudge_worker_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "cp_twilio_token_access" {
  secret_id = google_secret_manager_secret.twilio_auth_token.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.onboarding_contract_processor_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "stripe_secret_access" {
  secret_id = google_secret_manager_secret.stripe_webhook_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.stripe_webhook_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "sendgrid_key_access" {
  secret_id = google_secret_manager_secret.sendgrid_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.stripe_webhook_sa.email}"
}

# --- Firestore ---
# Constraint: Do NOT create the google_firestore_database resource (assume it exists).
# Run this command if the database is missing:
# --- Firestore ---
# Constraint: Do NOT create the google_firestore_database resource (assume it exists).
# Run this command if the database is missing:
# gcloud firestore databases create --location=europe-west2 --type=firestore-native
#
# WARNING: Deletion protection must be enabled manually for the Firestore database.
# Verify in console or run: gcloud firestore databases update --type=firestore-native --delete-protection

# --- Firestore Indexes ---
resource "google_firestore_index" "users_status_date_asc" {
  database = "(default)"
  collection = "users"
  
  fields {
    field_path = "activationStatus"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "signupDate"
    order      = "ASCENDING"
  }
}

# --- Storage ---
resource "google_storage_bucket" "contract_uploads" {
  name                        = "${var.project_id}-contract-uploads-secure"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  
  versioning {
    enabled = true
  }
}

# --- Networking ---
resource "google_compute_network" "main_vpc" {
  name                    = "main-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "connector_subnet" {
  name          = "connector-subnet"
  ip_cidr_range = "10.8.0.0/28"
  region        = var.region
  network       = google_compute_network.main_vpc.id
}

resource "google_vpc_access_connector" "connector" {
  name          = "vpc-connector"
  region        = var.region
  subnet {
    name = google_compute_subnetwork.connector_subnet.name
  }
}

# --- Cloud Run: Stripe Webhook ---
resource "google_cloud_run_service" "stripe_webhook" {
  name     = "stripe-webhook-handler"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.stripe_webhook_sa.email
      containers {
        image = "gcr.io/${var.project_id}/stripe-webhook-handler:latest"
        env {
          name = "STRIPE_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.stripe_api_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "STRIPE_WEBHOOK_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.stripe_webhook_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "SENDGRID_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.sendgrid_api_key.secret_id
              key  = "latest"
            }
          }
        env {
          name = "SENDGRID_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.sendgrid_api_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "SENDGRID_FROM_EMAIL"
          value = var.sendgrid_from_email
        }
    }
    
    metadata {
      annotations = {
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }
  }

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }
}

resource "google_cloud_run_service_iam_member" "stripe_webhook_invoker" {
  location = google_cloud_run_service.stripe_webhook.location
  service  = google_cloud_run_service.stripe_webhook.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# --- Cloud Load Balancer & Cloud Armor ---
resource "google_compute_global_address" "default" {
  name = "stripe-webhook-ip"
}

resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "stripe-webhook-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.stripe_webhook.name
  }
}

resource "google_compute_backend_service" "default" {
  name        = "stripe-webhook-backend"
  protocol    = "HTTPS"
  timeout_sec = 30
  enable_cdn  = false

  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }

  security_policy = google_compute_security_policy.policy.id
}

resource "google_compute_url_map" "default" {
  name            = "stripe-webhook-urlmap"
  default_service = google_compute_backend_service.default.id
}

resource "google_compute_target_https_proxy" "default" {
  name             = "stripe-webhook-proxy"
  url_map          = google_compute_url_map.default.id
  # ssl_certificates = ... (Not created in this task)
}

resource "google_compute_global_forwarding_rule" "default" {
  name       = "stripe-webhook-forwarding-rule"
  target     = google_compute_target_https_proxy.default.id
  port_range = "443"
  ip_address = google_compute_global_address.default.id
}

resource "google_compute_security_policy" "policy" {
  name = "stripe-webhook-policy"
  
  rule {
    action   = "allow"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = var.stripe_cidrs
      }
    }
    description = "Allow Stripe CIDRs"
  }

  rule {
    action   = "deny(403)"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Deny all other traffic"
  }
}

# --- Cloud Function: Smart Nudge Worker ---
resource "google_storage_bucket" "function_source" {
  name                        = "${var.project_id}-function-source"
  location                    = var.region
  uniform_bucket_level_access = true
}

data "archive_file" "smart_nudge_worker_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/smart-nudge-worker"
  output_path = "${path.module}/smart-nudge-worker.zip"
}

resource "google_storage_bucket_object" "smart_nudge_worker_zip" {
  name   = "smart-nudge-worker.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.smart_nudge_worker_zip.output_path
}

resource "google_cloudfunctions2_function" "smart_nudge_worker" {
  name        = "smart-nudge-worker"
  location    = var.region
  description = "Checks for inactive users and sends nudges"

  build_config {
    runtime     = "nodejs22"
    entry_point = "smartNudge"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.smart_nudge_worker_zip.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    service_account_email = google_service_account.nudge_worker_sa.email
    ingress_settings = "ALLOW_INTERNAL_ONLY"
    vpc_connector = google_vpc_access_connector.connector.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
    
    environment_variables = {
      TWILIO_FROM_NUMBER      = var.twilio_from_number
      NUDGE_A_THRESHOLD_HOURS = var.nudge_a_threshold_hours
      NUDGE_B_THRESHOLD_HOURS = var.nudge_b_threshold_hours
    }
    
    secret_environment_variables {
      key        = "TWILIO_ACCOUNT_SID"
      projectId  = var.project_id
      secret     = google_secret_manager_secret.twilio_account_sid.secret_id
      version    = "latest"
    }
    secret_environment_variables {
      key        = "TWILIO_AUTH_TOKEN"
      projectId  = var.project_id
      secret     = google_secret_manager_secret.twilio_auth_token.secret_id
      version    = "latest"
    }
  }
}

resource "google_cloud_run_service_iam_member" "scheduler_invoker" {
  location = google_cloudfunctions2_function.smart_nudge_worker.location
  service  = google_cloudfunctions2_function.smart_nudge_worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler_nudge_sa.email}"
}

# --- Cloud Scheduler ---
resource "google_cloud_scheduler_job" "nudge_job" {
  name             = "nudge-job"
  description      = "Trigger Smart Nudge Worker"
  schedule         = "0 */6 * * *" # Every 6 hours
  time_zone        = "Etc/UTC"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.smart_nudge_worker.service_config[0].uri
    
    oidc_token {
      service_account_email = google_service_account.scheduler_nudge_sa.email
    }
  }
}

# --- Cloud Function: Delivery Agent ---
data "archive_file" "delivery_agent_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/delivery_agent"
  output_path = "${path.module}/delivery-agent.zip"
}

resource "google_storage_bucket_object" "delivery_agent_zip" {
  name   = "delivery-agent.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.delivery_agent_zip.output_path
}

resource "google_cloudfunctions2_function" "delivery_agent" {
  name        = "delivery-agent"
  location    = var.region
  description = "Delivery Agent Notification"

  build_config {
    runtime     = "python311"
    entry_point = "delivery_agent"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.delivery_agent_zip.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    service_account_email = google_service_account.delivery_agent_sa.email
    ingress_settings = "ALLOW_INTERNAL_ONLY" # Triggered by Eventarc
    vpc_connector = google_vpc_access_connector.connector.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
  }
  
  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.contract_events.id
    retry_policy   = "RETRY_POLICY_RETRY"
    service_account_email = google_service_account.delivery_agent_sa.email
  }
}

resource "google_pubsub_topic" "contract_events" {
  name = "contract-events"
}

# --- Cloud Function: Contract Processor ---
data "archive_file" "contract_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/contract-processor"
  output_path = "${path.module}/contract-processor.zip"
}

resource "google_storage_bucket_object" "contract_processor_zip" {
  name   = "contract-processor.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.contract_processor_zip.output_path
}

resource "google_cloudfunctions2_function" "contract_processor" {
  name        = "contract-processor"
  location    = var.region
  description = "Processes uploaded contracts"

  build_config {
    runtime     = "nodejs22"
    entry_point = "processContract"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.contract_processor_zip.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    service_account_email = google_service_account.onboarding_contract_processor_sa.email
    ingress_settings = "ALLOW_INTERNAL_ONLY"
    vpc_connector = google_vpc_access_connector.connector.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
    
    environment_variables = {
      CONTRACT_AGENT_URL = var.contract_agent_url
      TWILIO_FROM_NUMBER = var.twilio_from_number
    }
    
    secret_environment_variables {
      key        = "TWILIO_ACCOUNT_SID"
      projectId  = var.project_id
      secret     = google_secret_manager_secret.twilio_account_sid.secret_id
      version    = "latest"
    }
    secret_environment_variables {
      key        = "TWILIO_AUTH_TOKEN"
      projectId  = var.project_id
      secret     = google_secret_manager_secret.twilio_auth_token.secret_id
      version    = "latest"
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.firestore.document.v1.created"
    event_filters {
      attribute = "database"
      value     = "(default)"
    }
    event_filters {
      attribute = "document"
      value     = "users/{userId}/contracts/{contractId}"
      operator  = "match-path-pattern"
    }
    service_account_email = google_service_account.onboarding_contract_processor_sa.email
  }
}
