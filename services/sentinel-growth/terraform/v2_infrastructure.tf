# BigQuery Dataset
resource "google_bigquery_dataset" "v2_dataset" {
  dataset_id                 = "ic_origin_themav2"
  friendly_name              = "IC Origin Thema V2"
  description                = "Web-scale crawling dataset for IC Origin V2"
  location                   = var.region
  delete_contents_on_destroy = false
}

# BigQuery Table: Raw Signals
resource "google_bigquery_table" "raw_signals" {
  dataset_id          = google_bigquery_dataset.v2_dataset.dataset_id
  table_id            = "raw_signals"
  deletion_protection = false

  schema = <<EOF
[
  {
    "name": "id",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Unique identifier for the signal"
  },
  {
    "name": "timestamp",
    "type": "TIMESTAMP",
    "mode": "REQUIRED",
    "description": "Ingestion timestamp"
  },
  {
    "name": "source_family",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "COMPANIES_HOUSE or REGIONAL_RSS"
  },
  {
    "name": "signal_type",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "GROWTH or RESCUE"
  },
  {
    "name": "entity_name",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Target entity name"
  },
  {
    "name": "entity_id",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Target entity ID (e.g. Company Number)"
  },
  {
    "name": "raw_content",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Raw JSON or Text content"
  },
  {
    "name": "metadata",
    "type": "JSON",
    "mode": "NULLABLE",
    "description": "Additional signal metadata"
  }
]
EOF
}

# BigQuery Table: Auctions Enhanced
resource "google_bigquery_table" "auctions_enhanced" {
  dataset_id          = google_bigquery_dataset.v2_dataset.dataset_id
  table_id            = "auctions_enhanced"
  deletion_protection = false

  schema = <<EOF
[
  {
    "name": "entity_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "canonical_name",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "psc_details",
    "type": "JSON",
    "mode": "NULLABLE"
  },
  {
    "name": "last_updated",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "resolution_metadata",
    "type": "JSON",
    "mode": "NULLABLE"
  }
]
EOF
}

# Networking for AlloyDB (Private Service Access)
resource "google_compute_global_address" "v2_peering_address" {
  name          = "ic-origin-v2-peering"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = "projects/${var.project_id}/global/networks/default"
}

resource "google_service_networking_connection" "v2_vpc_connection" {
  network                 = "projects/${var.project_id}/global/networks/default"
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.v2_peering_address.name]
}

# AlloyDB Cluster (for RAG with pgvector)
resource "google_alloydb_cluster" "v2_cluster" {
  cluster_id          = "ic-origin-v2-cluster"
  location            = var.region
  deletion_protection = false

  network_config {
    network = "projects/${var.project_id}/global/networks/default"
  }

  depends_on = [google_service_networking_connection.v2_vpc_connection]
}

resource "google_alloydb_instance" "v2_instance" {
  cluster       = google_alloydb_cluster.v2_cluster.name
  instance_id   = "v2-instance-01"
  instance_type = "PRIMARY"

  machine_config {
    cpu_count = 2
  }

  database_flags = {
    "google_columnar_engine.enabled" = "on"
    # pgvector is typically enabled by running "CREATE EXTENSION IF NOT EXISTS vector;" 
    # inside the database, but we can ensure the instance is sized appropriately.
  }
}

# Artifact Registry for Ingest API
resource "google_artifact_registry_repository" "ingest_repo" {
  location      = var.region
  repository_id = "ic-origin-ingest-repo"
  description   = "Docker repository for IC Origin Ingest API"
  format        = "DOCKER"
}

# Cloud Run: Scale-to-Zero Ingest API
resource "google_cloud_run_v2_service" "ingest_service" {
  name     = "ic-origin-ingest"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
    service_account = google_service_account.sentinel_sa.email
  }
}

# Cloud Scheduler: Cron Toggle (Disabled by default)
resource "google_cloud_scheduler_job" "ingest_cron" {
  name        = "v2-ingest-cron"
  description = "Trigger for web-scale crawling (Dormant)"
  schedule    = "0 * * * *"
  time_zone   = "UTC"
  paused      = true
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.ingest_service.uri}/ingest"
    oidc_token {
      service_account_email = google_service_account.sentinel_sa.email
    }
  }
}

# Cloud Run: Scale-to-Zero Orchestrator API
resource "google_cloud_run_v2_service" "orchestrator_service" {
  name     = "ic-origin-orchestrator"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
      env {
        name  = "AI_STUDIO_API_KEY"
        value = "placeholder-key" # Should be in Secret Manager in production
      }
      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }
    }
    service_account = google_service_account.sentinel_sa.email
  }
}

# Cloud Scheduler: Strategize Cron (Disabled by default)
resource "google_cloud_scheduler_job" "strategize_cron" {
  name        = "v2-strategize-cron"
  description = "Trigger for multi-agent strategy orchestration (Dormant)"
  schedule    = "0 0 * * *" # Daily
  time_zone   = "UTC"
  paused      = true
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.orchestrator_service.uri}/strategize"
    oidc_token {
      service_account_email = google_service_account.sentinel_sa.email
    }
  }
}

# GKE Autopilot Cluster (for agent workloads & spot training)
resource "google_container_cluster" "v2_autopilot" {
  name                = "ic-origin-v2-autopilot"
  location            = var.region
  enable_autopilot    = true
  deletion_protection = false

  # Private cluster to satisfy "constraints/compute.vmExternalIpAccess"
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false # Keep master public for easier control
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  ip_allocation_policy {
    cluster_ipv4_cidr_block  = "/16"
    services_ipv4_cidr_block = "/20"
  }

  network    = "default"
  subnetwork = "default"

  # Note: Autopilot manages node configuration automatically.
  # Spot VMs can be requested per-workload via nodeSelector.
}

# API Gateway (Lifecycle Management)
resource "google_api_gateway_api" "v2_gateway_api" {
  provider = google-beta
  api_id   = "ic-origin-v2-api"
}

resource "google_api_gateway_api_config" "v2_gateway_config" {
  provider             = google-beta
  api                  = google_api_gateway_api.v2_gateway_api.api_id
  api_config_id_prefix = "v2-config-"

  openapi_documents {
    document {
      path = "openapi.yaml"
      contents = base64encode(<<EOF
swagger: '2.0'
info:
  title: IC Origin V2 Gateway
  description: Lifecycle management for web-scale crawling
  version: 1.0.0
schemes:
  - https
produces:
  - application/json
paths:
  /activate:
    post:
      summary: Activate Dataflow/Orchestration crons
      operationId: activate
      x-google-backend:
        address: ${google_cloud_run_v2_service.orchestrator_service.uri}/activate
      responses:
        '200':
          description: OK
  /demo:
    post:
      summary: Trigger 2-hour mock crawl
      operationId: demo
      x-google-backend:
        address: ${google_cloud_run_v2_service.orchestrator_service.uri}/demo
      responses:
        '200':
          description: OK
  /pricing:
    get:
      summary: Get per-seat cost estimation
      operationId: pricing
      x-google-backend:
        address: ${google_cloud_run_v2_service.orchestrator_service.uri}/pricing
      responses:
        '200':
          description: OK
EOF
      )
    }
  }
}

resource "google_api_gateway_gateway" "v2_gateway" {
  provider   = google-beta
  api_config = google_api_gateway_api_config.v2_gateway_config.id
  gateway_id = "ic-origin-v2-gateway"
  region     = var.region
}

# Cloud Monitoring Dashboard (Operations Suite)
resource "google_monitoring_dashboard" "v2_dashboard" {
  dashboard_json = jsonencode({
    displayName = "IC Origin V2 Operations"
    gridLayout = {
      widgets = [
        {
          title = "Cloud Run Requests (Scale-to-Zero)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\""
                }
              }
            }]
          }
        },
        {
          title = "Cost Estimate (Dormant/Active)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"global\" metric.type=\"custom.googleapis.com/ic_origin/session_cost\""
                }
              }
            }]
          }
        }
      ]
    }
  })
}

# IAM: Dataset Access for SA
resource "google_bigquery_dataset_iam_member" "sa_bq_editor" {
  dataset_id = google_bigquery_dataset.v2_dataset.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.sentinel_sa.email}"
}
