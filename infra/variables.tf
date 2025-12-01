variable "project_id" {
  description = "The Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "The Google Cloud region to deploy resources in."
  type        = string
  default     = "us-central1"
}

variable "google_client_id_value" {
  description = "The Google OAuth client ID."
  type        = string
  sensitive   = true
  default     = "YOUR_CLIENT_ID" # Replace with actual value or load from a .tfvars file
}

variable "google_client_secret_value" {
  description = "The Google OAuth client secret."
  type        = string
  sensitive   = true
  default     = "YOUR_CLIENT_SECRET" # Replace with actual value or load from a .tfvars file
}
